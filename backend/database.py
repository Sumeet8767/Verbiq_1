from supabase_client import supabase
from datetime import datetime, timezone

def get_user_by_email(email):
    response = (
        supabase.table("users")
        .select("*")
        .eq("email", email)
        .execute()
    )
    
    if response.data:
        return response.data[0]
    
    return None

def create_user(email, password_hash):
    return (
        supabase.table("users")
        .insert(
            {
                "email" : email,
                "password_hash": password_hash,
                "created_at" : datetime.now(timezone.utc).isoformat(), 
                "updated_at" : datetime.now(timezone.utc).isoformat(), 
            }
        )
        .execute()
    )

def update_password(email, password_hash):
    return (
        supabase.table("users")
        .update(
            {
                "password_hash": password_hash,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("email", email)
        .execute()
    )

def user_exists(email):
    
    print("Searching for:", email)
    
    response = (
        supabase.table("users")
        .select("*")
        .eq("email", email)
        .execute()
    )
    
    print("Supabase Response:", response.data)
    
    return len(response.data) > 0