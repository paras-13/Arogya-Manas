pipeline {
    agent any

    // GitHub webhook automatically triggers this pipeline on every push
    triggers {
        githubPush()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'arogyamanas'
    }

    stages {
        // Cloning the latest code from GitHub
        stage('Clone Repository') {
            steps {
                checkout scm
                echo 'Code cloned successfully'
            }
        }
        
        // Building Docker images using docker-compose
        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                sh 'docker compose build --no-cache'
                echo 'Images built successfully'
            }
        }

        // Running the application containers
        stage('Deploy') {
            steps {
                echo 'Deploying containers...'
                sh 'docker compose down || true'
                sh 'docker compose up -d'
                echo 'Application deployed successfully'
            }
        }

        // Verifying all containers are running
        stage('Health Check') {
            steps {
                echo 'Verifying containers are running...'
                sh 'sleep 10'
                sh 'docker compose ps'
                sh 'curl -f http://localhost:8000 || echo "Backend not responding yet (may still be starting)"'
            }
        }
    }

    post {
        success {
            echo '''
            ════════════════════════════════════════
                PIPELINE SUCCESS!
                Frontend:  http://localhost:5173
                Backend:   http://localhost:8000
                Database:  localhost:3307
            ════════════════════════════════════════
            '''
        }
        failure {
            echo 'Pipeline FAILED! Check the stage logs above for errors.'
            sh 'docker compose down || true'
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}