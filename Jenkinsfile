pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: public.ecr.aws/docker/library/node:20.18-alpine
    command:
    - cat
    tty: true
  - name: docker
    image: public.ecr.aws/docker/library/docker:27.5-cli
    command:
    - cat
    tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
  - name: dind
    image: public.ecr.aws/docker/library/docker:27.5-dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
    securityContext:
      runAsUser: 0
"""
        }
    }

    environment {
        DOCKER_HUB_USER = 'nopparujjia'
        DOCKER_HUB_CRED = 'docker-hub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                container('node') {
                    echo 'Installing dependencies for Backend...'
                    dir('Backend') {
                        sh 'npm install'
                    }
                    echo 'Installing dependencies for Frontend...'
                    dir('Frontend') {
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Lint & Test') {
            steps {
                container('node') {
                    echo 'Running Lint for Frontend...'
                    dir('Frontend') {
                        sh 'npm run lint || true'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                container('docker') {
                    echo 'Building Docker Images...'
                    sh "docker build -t ${DOCKER_HUB_USER}/smart-logistics-backend:latest ./Backend"
                    sh "docker build -t ${DOCKER_HUB_USER}/smart-logistics-frontend:latest ./Frontend"
                }
            }
        }

        stage('Docker Push') {
            steps {
                container('docker') {
                    echo 'Pushing Images to Docker Hub...'
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CRED}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                        sh "docker push ${DOCKER_HUB_USER}/smart-logistics-backend:latest"
                        sh "docker push ${DOCKER_HUB_USER}/smart-logistics-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy to K8s') {
            steps {
                container('kubectl') {
                    echo 'Deploying to Kubernetes...'
                    sh 'kubectl apply -f k8s/app/namespace.yaml'
                    sh 'kubectl apply -f k8s/app/mysql.yaml'
                    sh 'kubectl apply -f k8s/app/backend.yaml'
                    sh 'kubectl apply -f k8s/app/frontend.yaml'
                    sh 'kubectl apply -f k8s/app/ingress.yaml'
                    
                    echo 'Waiting for deployment to complete...'
                    sh 'kubectl rollout status deployment/backend -n smart-logistics'
                    sh 'kubectl rollout status deployment/frontend -n smart-logistics'
                }
            }
        }
    }
}
