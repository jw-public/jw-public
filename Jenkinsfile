slackSend "Build Started - ${env.JOB_NAME} ${env.BUILD_NUMBER}"

node {
	// deleteDir()
	checkout scm

	dir "ansible", {
		def scmUrl = 'git@bitbucket.org:icereed/infrastructure-as-code.git'
		def credentials = 'bitbucket-ssh'
		def branch = 'master'
		git credentialsId: credentials, url: scmUrl, branch: branch
	}

	def versionNumber = "v.1.${env.BUILD_NUMBER}";
	sh "git checkout -b release/${versionNumber}"

	stage "Compile and test"

	def commitId  = lib.getCommitId()

    def versionFile = "export const version = { commit: \"${commitId}\", build: \"${env.BUILD_NUMBER}\" };"

    def versionPath = "meteor/Version.ts"

	sh "rm -f ${versionPath}"
	writeFile file: versionPath, text: versionFile
	def commitMessage = "Version ${versionNumber}"
	sh "git config user.email \"none@nowhere.com\""
	sh "git config user.name \"Jenkins Bot\""
	sh "git add ${versionPath} && git commit --m '${commitMessage}'"

	stage "Create docs"


	withDockerContainer "icereed/mkdocs-material:latest", {
		sh "cd userdocs && mkdocs build --clean"
	}

	stage "Create Docker image"
		def jwPublicImage = docker.build "icereed/jw-public:ci-build"
		def jwPublicDocsImage = null
		dir('userdocs') {
			jwPublicDocsImage = docker.build "icereed/jw-public-docs:ci-build"
		}


	stage "Push to registry"

		withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'docker-login-jw',
	                    usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
		  sh "docker login -u ${env.USERNAME} -p ${env.PASSWORD}"
	    }


		jwPublicImage.push(commitId);
		jwPublicDocsImage.push(commitId);


		def baseSite = "jw-public.org"

		stage "Redeploy on TEST"

			def webAppHostTest = "test.${baseSite}"
			def docsHostTest = "docs-test.${baseSite}"
			def stageName = "test"

			jwPublicImage.push(stageName);
			jwPublicDocsImage.push(stageName);
	        
			dir "ansible", {			
				ansibleScaleway "deployJwPublic.yml", "-e deployStages='[\"$stageName\"]'"
			}


	  stage("Redeploy on INT");
		def webAppHostInt = "int.${baseSite}";
		def docsHostInt = "docs-int.${baseSite}";
		stageName = "integration"

		jwPublicImage.push(stageName);
		jwPublicDocsImage.push(stageName);
	        
			dir "ansible", {		
				ansibleScaleway "deployJwPublic.yml", "-e deployStages='[\"$stageName\"]'"
			}

		stage("Redeploy on PROD");
		input message: 'Deploy to PROD?', submitter: 'icereed'
		sshagent (credentials: ['bitbucket-ssh']) {
			sh "git push --set-upstream origin release/${versionNumber}	"
		}
		def webAppHost = "${baseSite}";
		def docsHost = "docs.${baseSite}";
		stageName = "production"

		jwPublicImage.push(stageName);
		jwPublicDocsImage.push(stageName);

		input message: 'Deploy now or nightly?', submitter: 'icereed'
		
		dir "ansible", {			
			ansibleScaleway "deployJwPublic.yml", "-e deployStages='[\"$stageName\"]'"
		}

}