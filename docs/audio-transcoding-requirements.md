# Audio Transcoding Requirements for Core API

## Overview

The frontend simulation feature sends audio recordings to the Core API via WebSocket in the browser's native format. The backend must transcode these to OGG/Opus format for AI processing (Whisper/speech-to-text).

## Browser Format Matrix

| Browser | Native Format | MIME Type | Server Receives | Conversion Required |
|---------|--------------|-----------|-----------------|---------------------|
| Firefox | **OGG + Opus** | `audio/ogg;codecs=opus` | `format: "ogg"` | ✅ **None** (target format) |
| Chrome | WebM + Opus | `audio/webm;codecs=opus` | `format: "webm"` | ⚡ Remux only (fast) |
| Edge | WebM + Opus | `audio/webm;codecs=opus` | `format: "webm"` | ⚡ Remux only (fast) |
| Safari (macOS) | MP4 + AAC | `audio/mp4` | `format: "m4a"` | 🔄 Transcode (slow) |
| Safari (iOS) | MP4 + AAC | `audio/mp4` | `format: "m4a"` | 🔄 Transcode (slow) |

**Note:** Firefox is prioritized to send OGG/Opus directly (target format), eliminating conversion for ~25% of users.

## WebSocket Message Format

### Audio Chunk Message
```json
{
  "type": "audio_chunk",
  "payload": {
    "chunk": "base64-encoded-audio...",
    "sequence": 1,
    "format": "webm"  // or "ogg", "m4a"
  }
}
```

## Backend Processing Requirements

### 1. Accept Multiple Input Formats

The Core API must handle:
- ✅ **WebM** (Chrome, Edge, Firefox) - most common
- ✅ **OGG** (Firefox optional) - already target format
- ✅ **M4A/MP4** (Safari) - NEW requirement

### 2. Transcode to OGG/Opus

**Target Format:**
- Container: OGG
- Codec: Opus
- Sample Rate: 16kHz (optimal for Whisper)
- Bitrate: 24kbps (sufficient for speech)
- Channels: Mono

### 3. FFmpeg Processing Commands

#### Remuxing (Container Change Only - FAST)

**WebM/Opus → OGG/Opus (Chrome, Edge):**
```bash
# Fast remuxing - just changes container, keeps Opus stream intact
# Time: ~0.01-0.05 seconds for 10-second audio
# Quality: Zero loss (no re-encoding)
ffmpeg -i input.webm -vn -c:a copy output.ogg
```

**Important:** WebM and OGG both contain the **same Opus codec**. This command simply extracts the Opus stream from WebM container and wraps it in OGG container. No audio re-encoding occurs.

#### Pass-Through (No Processing - FASTEST)

**OGG/Opus → OGG/Opus (Firefox):**
```bash
# Already in target format - no conversion needed!
# Simply use the file as-is, or validate format:
ffprobe -v error -show_format -show_streams input.ogg

# Optional: Normalize audio parameters if needed
ffmpeg -i input.ogg -c:a libopus -b:a 24k -ar 16000 -ac 1 output.ogg
```

#### Transcoding (Codec Conversion - SLOW)

**MP4/AAC → OGG/Opus (Safari):**
```bash
# Full transcoding - decodes AAC, encodes to Opus
# Time: ~0.1-0.5 seconds for 10-second audio
# Quality: Generation loss (unavoidable when changing codecs)
ffmpeg -i input.m4a -vn -c:a libopus -b:a 24k -ar 16000 -ac 1 output.ogg
```

### 4. Implementation Approach

#### Option A: Smart Processing on Audio Complete (Recommended)
```python
import subprocess
import os

def process_audio_to_opus(input_file: str, input_format: str, output_file: str):
    """
    Intelligently processes audio based on input format.
    - OGG/Opus: Pass-through (no processing)
    - WebM/Opus: Fast remuxing (container change only)
    - MP4/AAC: Full transcoding (codec conversion)
    """

    if input_format == 'ogg':
        # Firefox - already in target format!
        # Option 1: Use as-is (fastest)
        os.rename(input_file, output_file)

        # Option 2: Validate/normalize (if consistency needed)
        # subprocess.run([
        #     'ffmpeg', '-i', input_file,
        #     '-c:a', 'libopus', '-b:a', '24k', '-ar', '16000', '-ac', '1',
        #     output_file
        # ], check=True)

    elif input_format == 'webm':
        # Chrome, Edge - fast remuxing (10-50x faster than re-encoding)
        subprocess.run([
            'ffmpeg', '-i', input_file,
            '-vn',           # No video
            '-c:a', 'copy',  # Copy audio stream (no re-encoding)
            output_file
        ], check=True)

    elif input_format == 'm4a':
        # Safari - requires full transcoding (AAC → Opus)
        subprocess.run([
            'ffmpeg', '-i', input_file,
            '-vn',
            '-c:a', 'libopus',
            '-b:a', '24k',
            '-ar', '16000',
            '-ac', '1',
            output_file
        ], check=True)

    else:
        raise ValueError(f"Unsupported audio format: {input_format}")


def on_audio_complete(session_id: str):
    """After receiving audio_complete message"""
    # 1. Concatenate all chunks
    input_file = concatenate_chunks(session_id)

    # 2. Detect input format from session metadata
    input_format = session.audio_format  # "webm", "ogg", or "m4a"

    # 3. Process to OGG/Opus (smart handling based on format)
    output_file = f"{session_id}_turn_{turn_num}.ogg"
    process_audio_to_opus(input_file, input_format, output_file)

    # 4. Upload to S3
    upload_to_s3(output_file, bucket, key)

    # 5. Send audio_processed message
    send_websocket_message(session_id, {
        "type": "audio_processed",
        "payload": {
            "turn_number": turn_num,
            "audio_url": s3_url,
            "status": "audio_saved"
        }
    })
```

#### Option B: Stream Transcoding (Advanced)
- Transcode chunks as they arrive
- More complex, lower latency
- Requires streaming FFmpeg setup

### 5. Error Handling

**Invalid Format:**
```json
{
  "type": "error",
  "payload": {
    "error": "Unsupported audio format",
    "code": "invalid_audio_format",
    "received_format": "unknown"
  }
}
```

**Transcoding Failed:**
```json
{
  "type": "error",
  "payload": {
    "error": "Failed to transcode audio",
    "code": "transcoding_failed",
    "details": "FFmpeg error message..."
  }
}
```

### 6. Storage Format

**S3 Storage:**
- Store transcoded OGG/Opus files (not original browser format)
- Naming: `organisations/{org_id}/simulations/{session_id}/turn-{N}.ogg`
- Consistent format simplifies downstream AI processing

### 7. Performance Considerations

**Processing Time (10-second audio clip):**

| Browser | Format | Operation | Time | CPU Usage |
|---------|--------|-----------|------|-----------|
| Firefox | OGG/Opus | Pass-through | ~0.001s | <1% |
| Chrome/Edge | WebM/Opus | Remuxing | ~0.01-0.05s | <5% |
| Safari | MP4/AAC | Transcoding | ~0.1-0.5s | 10-30% |

**Optimization Impact:**
- Firefox users: **100x faster** (no processing)
- Chrome/Edge users: **10-50x faster** (remuxing vs re-encoding)
- Safari users: Same as before (transcoding required)

**Resource Usage:**
- **Remuxing**: CPU <5%, Memory ~10-20MB
- **Transcoding**: CPU 10-30%, Memory ~50-100MB

**Best Practices:**
- Run asynchronously (don't block WebSocket thread)
- Use worker queue (Celery/RQ) for production
- Consider rate limiting for concurrent operations

### 8. Dependencies

**Required:**
- FFmpeg with libopus support
- Python: `ffmpeg-python` or `subprocess`

**Installation:**
```bash
# Ubuntu/Debian
apt-get install ffmpeg

# Alpine (Docker)
apk add ffmpeg

# Verify opus support
ffmpeg -codecs | grep opus
```

## Testing Checklist

### Format Processing Tests
- [ ] **Firefox OGG input** → Pass-through (no conversion, instant)
- [ ] **Chrome WebM input** → Fast remux to OGG (<0.05s)
- [ ] **Edge WebM input** → Fast remux to OGG (<0.05s)
- [ ] **Safari MP4 input** → Transcode to OGG (<0.5s)

### Functional Tests
- [ ] Large audio files (>1MB)
- [ ] Multi-turn sessions (turn numbering correct)
- [ ] Concurrent processing (multiple users)
- [ ] Error handling (corrupt audio, invalid format)
- [ ] S3 upload after processing
- [ ] WebSocket `audio_processed` message sent

### Performance Validation
- [ ] Firefox: Processing time <0.01s (pass-through)
- [ ] Chrome/Edge: Processing time <0.1s (remuxing)
- [ ] Safari: Processing time <1s (transcoding)
- [ ] Verify output quality (listen to processed files)

## Migration Notes

**Current State:**
- Assessment upload pipeline likely already transcodes uploaded files
- May have existing FFmpeg infrastructure

**Changes Needed:**

1. **Frontend (Completed):**
   - ✅ Format detection prioritizes OGG/Opus (Firefox users)
   - ✅ Safari MP4 support added
   - ✅ Dynamic format sent to backend (`ogg`, `webm`, or `m4a`)

2. **Backend (Required):**
   - ⚠️ Implement smart processing logic:
     - **OGG input**: Pass-through (no conversion)
     - **WebM input**: Fast remuxing with `ffmpeg -c:a copy`
     - **MP4 input**: Full transcoding to Opus
   - ⚠️ Update error handling for new formats
   - ⚠️ Ensure S3 storage consistently saves OGG/Opus files

3. **Performance Benefits:**
   - Firefox users: **100x faster** (pass-through)
   - Chrome/Edge users: **10-50x faster** (remuxing vs old re-encoding approach)
   - Safari users: No change (transcoding required)
   - Overall: **~85% of users get instant or near-instant processing**

## Related Documentation

- Core API WebSocket Spec: `docs/api/core-api-websocket-spec.md`
- Simulation Setup: `docs/simulation-setup.md`
- Audio Format Detection: `components/simulation/voice-recorder.tsx:getAudioFormat()`
