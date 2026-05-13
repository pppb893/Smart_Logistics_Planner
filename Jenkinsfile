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
  - name: terraform
    image: hashicorp/terraform:latest
    command:
    - cat
    tty: true
  - name: ansible
    image: alpine/ansible:latest
    command:
    - cat
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
    securityContext:
      runAsUser: 0
  serviceAccountName: jenkins-admin
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
                    
                    withCredentials([string(credentialsId: 'MAPBOX_TOKEN', variable: 'MAPBOX'),
                                    string(credentialsId: 'OPENWEATHER_KEY', variable: 'WEATHER')]) {
                        dir('Frontend') {
                            sh """
                                echo "VITE_MAPBOX_ACCESS_TOKEN=${MAPBOX}" > .env
                                echo "VITE_OPENWEATHER_API_KEY=${WEATHER}" >> .env
                                echo "VITE_API_URL=http://my-nginx.local" >> .env
                                echo "NODE_ENV=production" >> .env
                            """
                        }
                    }
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

        stage('Provision & Configure') {
            steps {
                container('terraform') {
                    echo 'Provisioning Infrastructure with Terraform...'
                    withCredentials([string(credentialsId: 'MAPBOX_TOKEN', variable: 'MAPBOX'),
                                    string(credentialsId: 'OPENWEATHER_KEY', variable: 'WEATHER')]) {
                        dir('terraform') {
                            sh 'terraform init'
                            sh "terraform apply -auto-approve -var='mapbox_token=${MAPBOX}' -var='openweather_key=${WEATHER}'"
                        }
                    }
                }
                container('ansible') {
                    echo 'Configuring Environment with Ansible...'
                    dir('ansible') {
                        sh '''
                            apk add --no-cache kubectl
                            ansible-playbook playbook.yml
                        '''
                    }
                }
            }
        }

        stage('Deploy to K8s') {
            steps {
                container('kubectl') {
                    echo 'Deploying to Kubernetes...'
                    // sh 'kubectl apply -f k8s/app/namespace.yaml' // Managed by Terraform now
                    sh 'kubectl apply -f k8s/app/mysql.yaml'
                    sh 'kubectl apply -f k8s/app/backend.yaml'
                    sh 'kubectl apply -f k8s/app/frontend.yaml'
                    sh 'kubectl apply -f k8s/app/ingress.yaml'
                    sh 'kubectl apply -f k8s/app/monitoring.yaml'
                    
                    echo 'Restarting deployments to pull latest image...'
                    sh 'kubectl rollout restart deployment/backend -n smart-logistics'
                    sh 'kubectl rollout restart deployment/frontend -n smart-logistics'
                    
                    echo 'Waiting for deployment to complete...'
                    sh 'kubectl rollout status deployment/backend -n smart-logistics'
                    sh 'kubectl rollout status deployment/frontend -n smart-logistics'
                    sh 'docker build -t nopparujjia/smart-logistics-frontend:latest ./Frontend'
                    sh 'docker push nopparujjia/smart-logistics-frontend:latest'
                    sh 'kubectl rollout restart deployment/frontend -n smart-logistics'
                }
            }
        }
    }
}
