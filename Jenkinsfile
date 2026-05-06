pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:20-alpine
    command:
    - cat
    tty: true
  - name: docker
    image: docker:latest
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
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
                        sh 'npm run lint'
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
    }
}
