# TikTok Video Automation Script
import requests
from gtts import gTTS
import os
from moviepy.editor import *

# It's better to use environment variables for API keys
PEXELS_API_KEY = "0Qa6xnEslIqFjxSQzJ18sixAoy8g8lMpQ9rSpy8ZKaDCc4d6i16YMbVQ"
PEXELS_API_URL = "https://api.pexels.com/videos/search"
VIDEO_PATH = "background_video.mp4"
AUDIO_PATH = "quote_audio.mp3"
OUTPUT_PATH = "final_video.mp4"

def get_random_quote():
    """
    Fetches a random quote from the Quotable API.
    """
    try:
        response = requests.get("https://api.quotable.io/random")
        response.raise_for_status()
        data = response.json()
        return data.get("content"), data.get("author")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching quote: {e}")
        return None, None

def text_to_speech(text, filename=AUDIO_PATH, lang='en'):
    """
    Converts text to speech and saves it as an MP3 file.
    """
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(filename)
        print(f"Audio content written to file \"{filename}\"")
        return True
    except Exception as e:
        print(f"Error converting text to speech: {e}")
        return False

def get_background_video(api_key, query, filename=VIDEO_PATH):
    """
    Fetches a background video from Pexels API and saves it.
    """
    headers = {"Authorization": api_key}
    params = {"query": query, "per_page": 5, "orientation": "portrait"}
    try:
        print(f"Searching for a '{query}' video on Pexels...")
        response = requests.get(PEXELS_API_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        if not data.get("videos"):
            print("No videos found for the query.")
            return False

        video_url = next((vf['link'] for v in data['videos'] for vf in v['video_files'] if vf.get('quality') == 'hd'), None)
        if not video_url:
            print("No HD video link found, taking the first available link.")
            video_url = data['videos'][0]['video_files'][0]['link']

        print(f"Downloading video from: {video_url}")
        video_response = requests.get(video_url, stream=True)
        video_response.raise_for_status()

        with open(filename, 'wb') as f:
            for chunk in video_response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"Video downloaded successfully as \"{filename}\"")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error fetching video from Pexels: {e}")
        return False
    except Exception as e:
        print(f"An error occurred during video download: {e}")
        return False

def create_final_video(video_path, audio_path, subtitle_text, output_path):
    """
    Combines video, audio, and subtitles into a final video.
    """
    try:
        print("Starting video creation process...")
        video_clip = VideoFileClip(video_path)
        audio_clip = AudioFileClip(audio_path)

        # Set video duration to audio duration
        video_clip = video_clip.set_duration(audio_clip.duration)

        # Crop the video to a 9:16 aspect ratio (TikTok's format)
        w, h = video_clip.size
        target_w = int(h * 9 / 16)
        if w > target_w:
             x_center = w / 2
             y_center = h / 2
             video_clip = video_clip.crop(x_center=x_center, y_center=y_center, width=target_w, height=h)

        # Create subtitle clip
        # Wrapping text for subtitles
        subtitle_text = '\n'.join(subtitle_text[i:i+30] for i in range(0, len(subtitle_text), 30))

        text_clip = TextClip(subtitle_text,
                             fontsize=40,
                             color='white',
                             font='Arial-Bold',
                             bg_color='black',
                             size=(video_clip.w*0.8, None),
                             method='caption')

        text_clip = text_clip.set_position(('center', 'center')).set_duration(audio_clip.duration)

        # Composite the video
        final_clip = CompositeVideoClip([video_clip, text_clip])
        final_clip = final_clip.set_audio(audio_clip)

        # Write the final video file
        print(f"Rendering final video to {output_path}...")
        final_clip.write_videofile(output_path, codec="libx264", audio_codec="aac", temp_audiofile='temp-audio.m4a', remove_temp=True)
        print("Final video created successfully!")
        return True
    except Exception as e:
        print(f"An error occurred during video creation: {e}")
        # A common issue is ImageMagick not being found for TextClip.
        # Check if the error message mentions ImageMagick.
        if "ImageMagick" in str(e):
            print("\n---")
            print("MoviePy's TextClip requires ImageMagick to be installed.")
            print("Please install it on your system and try again.")
            print("---")
        return False

def main():
    # 1. Get Quote
    print("Fetching a random quote...")
    quote, author = get_random_quote()

    if not quote or not author:
        print("\nCould not retrieve a quote. Using a default quote.")
        quote = "The greatest glory in living lies not in never falling, but in rising every time we fall."
        author = "Nelson Mandela"

    # 2. Generate Audio
    full_text = f"{quote}. By {author}."
    if not text_to_speech(full_text):
        print("TTS conversion failed. Aborting.")
        return

    # 3. Get Background Video
    if not get_background_video(PEXELS_API_KEY, "nature"):
        print("Failed to download background video. Aborting.")
        return

    # 4. Create Final Video
    subtitle_text = f"\"{quote}\"\n\n- {author}"
    if not create_final_video(VIDEO_PATH, AUDIO_PATH, subtitle_text, OUTPUT_PATH):
        print("Failed to create the final video.")
        return

    print("\nAutomation complete. Final video is at:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
