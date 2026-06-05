# Test script with cURL

This is a set of test commands and test scenarios for new implemented features, but did not have a front-end handler yet.

## 1. Test upload file
Currently, the function to upload and change avatar (both normal users and consultants) is working, so, the function
for only consultants - to manage their galleries (cover images, hobbie images,...) is critical, since it is their signature
and can affect to the number of bookings they would receive in the future

```bash
curl -X POST http://localhost/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"email-in-here@here.com", "password":"password-in-here"}'
```

Grab the token response, then put them up in this command

```bash
curl -X POST http://localhost/api/v1/consultant/media \
      -H "Authorization: Bearer get-from-above-command" \
      -F "file=@path-to-file" \
      -F "type=gallery" # there are 2 types: cover or gallery
```
