# Quản Lý Học Sinh - Microservices .NET

Dự án hệ thống quản lý học sinh/sinh viên sử dụng kiến trúc Microservices với C# (.NET 8/9).

## Các service chính
- IdentityService: Quản lý đăng nhập, vai trò
- StudentService: Quản lý hồ sơ học sinh
- ClassService: Quản lý lớp học, điểm số
- ...

## Công nghệ
- .NET 9
- ASP.NET Core
- Entity Framework Core + PostgreSQL
- MassTransit + RabbitMQ (event-driven)
- Docker + .NET Aspire

## Chạy local
docker-compose up -d

## Dự án gồm 58 API 
