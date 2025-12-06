#!/usr/bin/env python3
"""
Muslim Prayer Countdown Timer
A professional prayer time tracker with audio notifications and automatic location detection.
"""

import json
import os
import sys
import time
import requests
from datetime import datetime, timedelta
from pathlib import Path
import threading
import pygame
from typing import Dict, Optional, Tuple
import math

class PrayerTimer:
    """Main prayer timer class with countdown and notification features."""
    
    PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    CONFIG_FILE = 'prayer_config.json'
    DEFAULT_AZAN_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3'
    
    # Announcement intervals (in minutes before prayer)
    ANNOUNCEMENT_INTERVALS = [180, 120, 90, 60, 45, 30, 20]  # After 20, switch to per-minute
    
    def __init__(self):
        """Initialize the prayer timer."""
        self.config = self.load_or_create_config()
        self.prayer_times = {}
        self.announced_intervals = set()
        self.current_prayer_announced = False
        pygame.mixer.init()
        
    def load_or_create_config(self) -> Dict:
        """Load existing config or create new one with auto-detected location."""
        if os.path.exists(self.CONFIG_FILE):
            print(f"✓ Loading configuration from {self.CONFIG_FILE}")
            with open(self.CONFIG_FILE, 'r') as f:
                config = json.load(f)
                print(f"✓ Location: {config.get('city', 'Unknown')}, {config.get('country', 'Unknown')}")
                return config
        
        print("⚙ Configuration file not found. Creating new configuration...")
        config = self.create_default_config()
        self.save_config(config)
        return config
    
    def create_default_config(self) -> Dict:
        """Create default configuration with auto-detected location."""
        print("📍 Auto-detecting location...")
        location = self.detect_location()
        
        config = {
            'latitude': location['latitude'],
            'longitude': location['longitude'],
            'city': location['city'],
            'country': location['country'],
            'method': 2,  # ISNA calculation method
            'azan_file': 'azan.mp3',
            'use_default_azan': True,
            'announcement_voice': True
        }
        
        print(f"✓ Location detected: {config['city']}, {config['country']}")
        print(f"✓ Coordinates: {config['latitude']:.4f}, {config['longitude']:.4f}")
        
        return config
    
    def detect_location(self) -> Dict:
        """Auto-detect user location using IP geolocation."""
        try:
            response = requests.get('http://ip-api.com/json/', timeout=5)
            data = response.json()
            
            if data['status'] == 'success':
                return {
                    'latitude': data['lat'],
                    'longitude': data['lon'],
                    'city': data['city'],
                    'country': data['country']
                }
        except Exception as e:
            print(f"⚠ Location detection failed: {e}")
        
        # Fallback to default location (Mecca)
        print("⚠ Using default location: Mecca, Saudi Arabia")
        return {
            'latitude': 21.4225,
            'longitude': 39.8262,
            'city': 'Mecca',
            'country': 'Saudi Arabia'
        }
    
    def save_config(self, config: Dict):
        """Save configuration to file."""
        with open(self.CONFIG_FILE, 'w') as f:
            json.dump(config, indent=2, fp=f)
        print(f"✓ Configuration saved to {self.CONFIG_FILE}")
    
    def fetch_prayer_times(self) -> Dict:
        """Fetch today's prayer times from API."""
        lat = self.config['latitude']
        lon = self.config['longitude']
        method = self.config['method']
        
        today = datetime.now().strftime('%d-%m-%Y')
        url = f'http://api.aladhan.com/v1/timings/{today}'
        params = {
            'latitude': lat,
            'longitude': lon,
            'method': method
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data['code'] == 200:
                timings = data['data']['timings']
                return {prayer: timings[prayer] for prayer in self.PRAYERS}
        except Exception as e:
            print(f"✗ Error fetching prayer times: {e}")
            sys.exit(1)
    
    def display_prayer_times(self):
        """Display today's prayer times in a formatted table."""
        date_str = datetime.now().strftime('%A, %B %d, %Y')
        print("\n" + "="*60)
        print(f"🕌 PRAYER TIMES FOR {date_str.upper()}")
        print(f"📍 {self.config['city']}, {self.config['country']}")
        print("="*60)
        
        for prayer in self.PRAYERS:
            time_str = self.prayer_times[prayer]
            print(f"  {prayer:10} : {time_str}")
        
        print("="*60 + "\n")
    
    def get_next_prayer(self) -> Tuple[Optional[str], Optional[datetime]]:
        """Get the next upcoming prayer and its time."""
        now = datetime.now()
        
        for prayer in self.PRAYERS:
            prayer_time_str = self.prayer_times[prayer]
            prayer_time = datetime.strptime(prayer_time_str, '%H:%M').replace(
                year=now.year, month=now.month, day=now.day
            )
            
            if prayer_time > now:
                return prayer, prayer_time
        
        # If no prayer left today, return tomorrow's Fajr
        tomorrow = now + timedelta(days=1)
        fajr_time = datetime.strptime(self.prayer_times['Fajr'], '%H:%M').replace(
            year=tomorrow.year, month=tomorrow.month, day=tomorrow.day
        )
        return 'Fajr', fajr_time
    
    def get_time_remaining(self, target_time: datetime) -> Tuple[int, int, int]:
        """Calculate hours, minutes, seconds remaining until target time."""
        now = datetime.now()
        delta = target_time - now
        total_seconds = int(delta.total_seconds())
        
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return hours, minutes, seconds
    
    def should_announce(self, minutes_remaining: int) -> bool:
        """Determine if announcement should be made at current interval."""
        # For intervals in ANNOUNCEMENT_INTERVALS
        if minutes_remaining in self.ANNOUNCEMENT_INTERVALS:
            if minutes_remaining not in self.announced_intervals:
                self.announced_intervals.add(minutes_remaining)
                return True
        
        # For last 20 minutes, announce every minute
        elif 1 <= minutes_remaining < 20:
            if minutes_remaining not in self.announced_intervals:
                self.announced_intervals.add(minutes_remaining)
                return True
        
        return False
    
    def text_to_speech(self, text: str):
        """Simple text-to-speech announcement (print-based for cross-platform)."""
        print(f"\n🔔 ANNOUNCEMENT: {text}")
        # For actual TTS, you could use pyttsx3 or gTTS libraries
        # This is a simplified version for demonstration
    
    def play_azan(self):
        """Play the azan audio file."""
        azan_file = self.config['azan_file']
        
        # Download default azan if needed
        if self.config['use_default_azan'] and not os.path.exists(azan_file):
            print(f"📥 Downloading default azan...")
            try:
                response = requests.get(self.DEFAULT_AZAN_URL, timeout=30)
                with open(azan_file, 'wb') as f:
                    f.write(response.content)
                print(f"✓ Azan downloaded to {azan_file}")
            except Exception as e:
                print(f"⚠ Could not download azan: {e}")
                return
        
        # Play azan
        if os.path.exists(azan_file):
            try:
                print(f"🎵 Playing Azan...")
                pygame.mixer.music.load(azan_file)
                pygame.mixer.music.play()
                
                # Wait for azan to finish
                while pygame.mixer.music.get_busy():
                    time.sleep(1)
                    
            except Exception as e:
                print(f"⚠ Error playing azan: {e}")
        else:
            print(f"⚠ Azan file not found: {azan_file}")
    
    def format_time_remaining(self, hours: int, minutes: int, seconds: int) -> str:
        """Format remaining time as string."""
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def run(self):
        """Main timer loop."""
        print("\n🕌 MUSLIM PRAYER COUNTDOWN TIMER")
        print("="*60)
        
        # Fetch and display prayer times
        self.prayer_times = self.fetch_prayer_times()
        self.display_prayer_times()
        
        print("⏰ Timer started. Press Ctrl+C to exit.\n")
        
        while True:
            try:
                prayer_name, prayer_time = self.get_next_prayer()
                
                if not prayer_name:
                    print("⚠ No upcoming prayers found.")
                    time.sleep(60)
                    continue
                
                hours, minutes, seconds = self.get_time_remaining(prayer_time)
                total_minutes = hours * 60 + minutes
                
                # Clear line and display countdown
                time_str = self.format_time_remaining(hours, minutes, seconds)
                print(f"\r⏰ Next Prayer: {prayer_name:8} at {prayer_time.strftime('%H:%M')} | Time Remaining: {time_str:12}", end='', flush=True)
                
                # Check if it's prayer time
                if total_minutes == 0 and seconds == 0:
                    if not self.current_prayer_announced:
                        print(f"\n\n{'='*60}")
                        print(f"🕌 IT'S TIME FOR {prayer_name.upper()} PRAYER!")
                        print(f"{'='*60}\n")
                        
                        self.play_azan()
                        self.display_prayer_times()
                        
                        self.current_prayer_announced = True
                        self.announced_intervals.clear()
                        
                        # Wait a bit before checking next prayer
                        time.sleep(60)
                        continue
                else:
                    self.current_prayer_announced = False
                
                # Make announcements
                if self.should_announce(total_minutes):
                    if total_minutes >= 60:
                        hours_msg = total_minutes // 60
                        mins_msg = total_minutes % 60
                        if mins_msg > 0:
                            msg = f"{hours_msg} hour(s) and {mins_msg} minute(s) until {prayer_name} prayer"
                        else:
                            msg = f"{hours_msg} hour(s) until {prayer_name} prayer"
                    else:
                        msg = f"{total_minutes} minute(s) until {prayer_name} prayer"
                    
                    self.text_to_speech(msg)
                
                time.sleep(1)
                
            except KeyboardInterrupt:
                print("\n\n✓ Timer stopped. May Allah accept your prayers.")
                break
            except Exception as e:
                print(f"\n✗ Error: {e}")
                time.sleep(5)


def main():
    """Entry point for the application."""
    timer = PrayerTimer()
    timer.run()


if __name__ == '__main__':
    main()