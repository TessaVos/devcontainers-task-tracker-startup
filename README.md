# Task Manager - DevContainers Starter Project

A starter project for my blog post about **DevContainers** and how they solve common development environment problems. This project demonstrates a task management application built with **Next.js**, **Fastify**, **PostgreSQL**, and **Kubernetes**.

> **📖 Read the full blog post**: [TITLE](#) *(coming soon)*
> 
> **🚀 See the complete implementation**: Check out the [`complete-implementation`](https://github.com/TessaVos/devcontainers-task-tracker-startup/tree/complete-implementation) branch for the fully featured version with DevContainers configuration.

## 🏗️ Architecture Overview

This application follows a **clean architecture** pattern with clear separation of concerns:

### Backend (Node.js + Fastify + TypeScript)
- **API Layer**: RESTful endpoints with OpenAPI documentation
- **Service Layer**: Business logic and validation using Zod
- **Data Layer**: PostgreSQL integration with connection pooling
- **Domain Layer**: Type-safe models and interfaces

### Frontend (Next.js 14 + TypeScript + Tailwind CSS)
- **App Router**: Modern Next.js routing with server components
- **State Management**: React Query for server state management
- **UI Components**: Custom components with Tailwind CSS
- **Type Safety**: Shared TypeScript types between frontend and backend

### Database
- **Schema**: Well-structured tables with constraints and indexes
- **Migrations**: Database initialization scripts
- **Performance**: Optimized queries with proper indexing

## 📁 Project Structure

```
devcontainers/
├── backend/                    # Fastify API server
│   ├── src/
│   │   ├── api/               # REST API routes
│   │   ├── services/          # Business logic layer
│   │   ├── data/              # Data access layer
│   │   ├── domain/            # Domain models and types
│   │   └── index.ts           # Application entry point
│   ├── config/                # Configuration management
│   ├── database/              # Database scripts
│   ├── Dockerfile             # Production container image
│   └── package.json           # Dependencies and scripts
├── frontend/                   # Next.js web application
│   ├── src/
│   │   ├── app/               # Next.js app router pages
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Utilities and API client
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   ├── Dockerfile             # Production container image
│   └── package.json           # Dependencies and scripts
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml         # Namespace and ConfigMaps
│   ├── database/              # PostgreSQL deployment
│   ├── backend/               # API server deployment
│   └── frontend/              # Frontend deployment with Ingress
```

## 🚀 Getting Started

### Prerequisites

- **Docker**
- **K3d**

## ☸️ Kubernetes Deployment

### Create k3d Cluster

First, create a k3d cluster with the proper port mapping:

```bash
# Create k3d cluster with loadbalancer port mapping
k3d cluster create devcontainers --port "8081:80@loadbalancer"
```

### Build and Load Images

After creating the cluster, build the Docker images and load them into k3d:

```bash
# Build the backend image
docker build -t task-manager-backend:latest ./backend

# Build the frontend image  
docker build -t task-manager-frontend:latest ./frontend

# Load images into k3d cluster
k3d image import task-manager-backend:latest -c devcontainers
k3d image import task-manager-frontend:latest -c devcontainers
```

### Deploy to Kubernetes

Apply the Kubernetes manifests in the correct order:

```bash
# First, create the namespace
kubectl apply -f k8s/namespace.yaml

# Then apply all other manifests
kubectl apply -f k8s/database/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Check deployment status
kubectl get pods -n task-manager
kubectl get services -n task-manager
kubectl get ingress -n task-manager
```

### Access the Application

Add to your `/etc/hosts` file:
```
127.0.0.1 task-manager.local
```

Access the application:
- Frontend: http://task-manager.local:8081

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For questions and support, please open an issue in the repository.
