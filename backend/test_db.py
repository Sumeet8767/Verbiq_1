from database import user_exists, get_user_by_email

email = "test111@gmail.com"

print("Exists:", user_exists(email))
print("User:", get_user_by_email(email))