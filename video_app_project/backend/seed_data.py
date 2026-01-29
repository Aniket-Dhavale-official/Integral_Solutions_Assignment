#!/usr/bin/env python3
"""
Seed script to populate MongoDB with test data
Run: python seed_data.py
"""

from dotenv import load_dotenv
load_dotenv()

from db.mongo import get_db_client
from werkzeug.security import generate_password_hash
from datetime import datetime
from uuid import uuid4

def seed_users():
    """Add test users to MongoDB"""
    client = get_db_client()
    db = client.get_default_database()
    users = db["users"]
    
    # Clear existing test users
    users.delete_many({"email": {"$in": ["test@example.com", "demo@example.com"]}})
    
    test_users = [
        {
            "user_id": str(uuid4()),
            "full_name": "Test User",
            "email": "test@example.com",
            "password_hash": generate_password_hash("TestPassword123!"),
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": str(uuid4()),
            "full_name": "Demo User",
            "email": "demo@example.com",
            "password_hash": generate_password_hash("DemoPassword123!"),
            "created_at": datetime.utcnow(),
        },
    ]
    
    result = users.insert_many(test_users)
    print(f"✓ Added {len(result.inserted_ids)} test users")
    print(f"  - Email: test@example.com | Password: TestPassword123!")
    print(f"  - Email: demo@example.com | Password: DemoPassword123!")

def seed_videos():
    """Add test videos to MongoDB"""
    client = get_db_client()
    db = client.get_default_database()
    videos = db["videos"]
    
    # Clear existing videos
    videos.delete_many({})
    
    test_videos = [
        {
            "title": "Introduction to Python",
            "description": "Learn the basics of Python programming",
            "youtube_id": "kqtD5dpn3C0",
            "thumbnail_url": "https://i.ytimg.com/vi/kqtD5dpn3C0/maxresdefault.jpg",
            "is_active": True,
            "created_at": datetime.utcnow(),
        },
        {
            "title": "React Native Tutorial",
            "description": "Build mobile apps with React Native",
            "youtube_id": "ur6I5GQvWQA",
            "thumbnail_url": "https://i.ytimg.com/vi/ur6I5GQvWQA/maxresdefault.jpg",
            "is_active": True,
            "created_at": datetime.utcnow(),
        },
    ]
    
    result = videos.insert_many(test_videos)
    print(f"✓ Added {len(result.inserted_ids)} test videos")
    for video in test_videos:
        print(f"  - {video['title']}")

def seed_indexes():
    """Create database indexes"""
    client = get_db_client()
    db = client.get_default_database()
    
    # Users indexes
    db["users"].create_index("email", unique=True)
    print("✓ Created users.email unique index")
    
    # Login attempts index
    db["login_attempts"].create_index("timestamp", expireAfterSeconds=300)
    print("✓ Created login_attempts TTL index (5 min)")
    
    # Token blacklist index
    db["token_blacklist"].create_index("expires_at", expireAfterSeconds=0)
    print("✓ Created token_blacklist TTL index")

if __name__ == "__main__":
    print("Seeding MongoDB with test data...")
    seed_users()
    seed_videos()
    seed_indexes()
    print("\n✓ Database seeded successfully!")
