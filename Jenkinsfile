pipeline {
    agent any

    environment {
        // Jenkins credential "dockerhub-credentials" (Docker Hub username + access token)
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_BACKEND         = "${DOCKERHUB_CREDENTIALS_USR}/lawfirm-backend"
        IMAGE_FRONTEND        = "${DOCKERHUB_CREDENTIALS_USR}/lawfirm-frontend"
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
    }

    options {
        timestamps()
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log --oneline -3'
            }
        }

        stage('Backend: install & test') {
            steps {
                dir('backend') {
                    sh 'npm ci --ignore-scripts --fetch-retries=5'
                    // A failing test fails the build.
                    sh 'npm test'
                }
            }
        }

        stage('Security audit') {
            parallel {
                stage('Backend audit') {
                    steps {
                        dir('backend') {
                            // Findings turn the stage yellow (UNSTABLE) but do not block the release.
                            catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                                sh 'npm audit --audit-level=high'
                            }
                        }
                    }
                }
                stage('Frontend audit') {
                    steps {
                        dir('frontend') {
                            catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                                sh 'npm install --package-lock-only --ignore-scripts && npm audit --audit-level=high'
                            }
                        }
                    }
                }
            }
        }

        stage('Build images') {
            steps {
                sh 'docker build -t $IMAGE_BACKEND:$IMAGE_TAG -t $IMAGE_BACKEND:latest ./backend'
                sh 'docker build -t $IMAGE_FRONTEND:$IMAGE_TAG -t $IMAGE_FRONTEND:latest ./frontend'
                sh 'docker images | grep lawfirm || true'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
                sh 'docker push $IMAGE_BACKEND:$IMAGE_TAG'
                sh 'docker push $IMAGE_BACKEND:latest'
                sh 'docker push $IMAGE_FRONTEND:$IMAGE_TAG'
                sh 'docker push $IMAGE_FRONTEND:latest'
            }
            post {
                always { sh 'docker logout || true' }
            }
        }

        stage('Deploy (blue-green)') {
            steps {
                // Jenkins credential "kubeconfig" (secret file) -> $KUBECONFIG
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh 'bash devops/scripts/deploy.sh'
                }
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} deployed. Open http://localhost:30080"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} FAILED - see the red stage above. Live traffic is only switched after the new version passes its smoke test."
        }
        always {
            sh 'docker rmi $IMAGE_BACKEND:$IMAGE_TAG $IMAGE_FRONTEND:$IMAGE_TAG || true'
            cleanWs()
        }
    }
}
