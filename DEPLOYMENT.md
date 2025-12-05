# Deployment Guide for AWS

## Prerequisites

- AWS Account (AWS Educate/Student account)
- AWS CLI installed and configured
- Git installed

## Option 1: Deploy to AWS EC2

### 1. Launch EC2 Instance

1. Log in to AWS Console
2. Navigate to EC2 → Launch Instance
3. Choose **Ubuntu Server 22.04 LTS**
4. Instance type: **t2.small** or higher (minimum)
5. Configure Security Group:
   - SSH (22) - Your IP
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
   - Custom TCP (3001) - Anywhere (Node.js)
   - Custom TCP (8000) - Anywhere (Python)
   - Custom TCP (5173) - Anywhere (React dev)
6. Create/select key pair
7. Launch instance

### 2. Connect to EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Git
sudo apt install -y git

# Install build essentials for OpenCV
sudo apt install -y build-essential cmake pkg-config
sudo apt install -y libopencv-dev python3-opencv
```

### 4. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/AlexBesios/Event-Access-Control.git
cd Event-Access-Control

# Install frontend dependencies
npm install

# Install Node.js backend
cd server-node
npm install
cd ..

# Setup Python environment
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 5. Build Frontend for Production

```bash
npm run build
```

### 6. Setup Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start Python service
cd api
pm2 start "source venv/bin/activate && python face_service.py" --name python-face-service
cd ..

# Start Node.js service
cd server-node
pm2 start src/server.js --name nodejs-api
cd ..

# Serve built frontend
pm2 serve dist 5173 --spa --name react-frontend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### 7. Configure Nginx (Optional - Production)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/event-access-control
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Node.js API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Python Face API
    location /face {
        proxy_pass http://localhost:8000/api/face;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/event-access-control /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Option 2: Deploy to AWS Elastic Beanstalk

### 1. Install EB CLI

```bash
pip install awsebcli
```

### 2. Initialize Elastic Beanstalk

```bash
eb init -p node.js event-access-control --region us-east-1
```

### 3. Create Environment

```bash
eb create production-env
```

### 4. Deploy

```bash
npm run build
eb deploy
```

## Option 3: Deploy Using Docker (AWS ECS)

### 1. Create Dockerfile

**Dockerfile.nodejs:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server-node/package*.json ./
RUN npm install --production
COPY server-node/ ./
EXPOSE 3001
CMD ["node", "src/server.js"]
```

**Dockerfile.python:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libopencv-dev
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./
EXPOSE 8000
CMD ["python", "face_service.py"]
```

### 2. Build and Push to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name event-access-nodejs
aws ecr create-repository --repository-name event-access-python

# Build images
docker build -f Dockerfile.nodejs -t event-access-nodejs .
docker build -f Dockerfile.python -t event-access-python .

# Tag and push
docker tag event-access-nodejs:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/event-access-nodejs:latest
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/event-access-nodejs:latest

docker tag event-access-python:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/event-access-python:latest
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/event-access-python:latest
```

## Database Considerations

### Using AWS RDS (Recommended for Production)

The current SQLite setup is for development. For production:

1. Migrate to PostgreSQL on AWS RDS
2. Update connection strings in both Node.js and Python services
3. Use environment variables for credentials

### Keep SQLite (Simple Deployment)

For AWS Student/Educate projects, SQLite is acceptable:
- Store database on persistent EBS volume
- Regular backups to S3
- Limited concurrent users

## Environment Variables

Create `.env` files:

**server-node/.env:**
```env
PORT=3001
PYTHON_API_URL=http://localhost:8000
DATABASE_PATH=../api/event_access.db
NODE_ENV=production
```

## Security Checklist

- [ ] Change default ports
- [ ] Enable HTTPS with SSL certificate (AWS Certificate Manager)
- [ ] Implement authentication (JWT)
- [ ] Add rate limiting
- [ ] Enable CORS only for your domain
- [ ] Secure environment variables
- [ ] Regular security updates
- [ ] Implement logging and monitoring

## Monitoring

### CloudWatch Setup

```bash
# Install CloudWatch agent
sudo apt install -y amazon-cloudwatch-agent

# Configure CloudWatch
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### View Logs

```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Backup Strategy

### Automated Backups

```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp api/event_access.db "$BACKUP_DIR/db_$DATE.db"

# Upload to S3
aws s3 cp "$BACKUP_DIR/db_$DATE.db" s3://your-bucket/backups/

# Keep only last 7 days locally
find $BACKUP_DIR -name "db_*.db" -mtime +7 -delete
```

```bash
# Make executable
chmod +x backup.sh

# Schedule with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/Event-Access-Control/backup.sh
```

## Troubleshooting

### Service not starting
```bash
pm2 logs
pm2 status
```

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Permission issues
```bash
sudo chown -R ubuntu:ubuntu /home/ubuntu/Event-Access-Control
```

## Cost Optimization (AWS Student)

- Use **t2.micro** free tier when possible
- Stop instances when not in use
- Use AWS Budget alerts
- Clean up unused resources
- Use spot instances for development

## Support

For deployment issues:
- Check AWS CloudWatch logs
- Review PM2 logs: `pm2 logs`
- Check system logs: `sudo journalctl -xe`

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
