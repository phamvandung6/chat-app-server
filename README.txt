To run server:

docker compose up --build

error code:

400: Access denied, refresh_token is required
401: Invalid token
403: Token blacklisted


# Todo

- Khi đăng kí thì gửi otp qua email
- Sửa lại payload của các token, thêm token_type vào payload
- Chú ý decode token ở backend, tại vì khi frontend gắn refresh_token vào header thì vẫn nhận được response
- Kiểm tra lại thời gian hết hạn của refresh_token khi gửi refresh_token, xem thời gian có bị thay đổi không
- Triển khai cache user info trên redis.
- Tối ưu socket server