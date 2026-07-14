from auth import create_access_token, verify_access_token

token = create_access_token(
    {
        "email": "test@gmail.com"
    }
)

print("TOKEN:")
print(token)

print()

print("VERIFY:")
print(
    verify_access_token(token)
)