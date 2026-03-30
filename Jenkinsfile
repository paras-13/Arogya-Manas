pipeline {
    agent any

    environment {
        // Tagging images exactly with your new Docker Hub username so the cluster can pull them natively
        DOCKER_USERNAME = "paras13"
        BACKEND_IMAGE = "${DOCKER_USERNAME}/arogya_manas_backend_image:latest"
        FRONTEND_IMAGE = "${DOCKER_USERNAME}/arogya_manas_frontend_image:latest"
        
        // This credential ID must be created in Jenkins securely
        // Go to Jenkins -> Manage Jenkins -> Credentials -> 'Global' -> 'Add Credentials'
        // Type: Username with password
        // ID: docker-hub-credentials
        DOCKER_CREDS = "docker-hub-credentials"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Cloud Docker Images') {
            steps {
                echo "Building Backend Image..."
                dir('back') {
                    bat "docker build -t %BACKEND_IMAGE% ."
                }
                
                echo "Building Frontend Image..."
                dir('frontend') {
                    bat "docker build -t %FRONTEND_IMAGE% ."
                }
            }
        }
        
        stage('Push to Global Registry (Docker Hub)') {
            steps {
                // Securely authenticate to Docker Hub without hardcoding passwords
                withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDS, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    bat "docker login -u %USER% -p %PASS%"
                    bat "docker push %BACKEND_IMAGE%"
                    bat "docker push %FRONTEND_IMAGE%"
                }
            }
        }
    }

    post {
        always {
            echo 'Production CI/CD Pipeline execution complete.'
        }
        success {
            echo 'Deployment successful! Images are now securely hosted on Docker Hub under paras13 account.'
            echo 'Next Step: Update the Kubernetes .yaml files to deploy these images to the AWS cluster!'
        }
        failure {
            echo 'Deployment failed. Please check the logs (usually caused by missing Jenkins Docker credentials or syntax errors).'
        }
    }
}
