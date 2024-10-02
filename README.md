EduCompanion

EduCompanion is a Chrome extension designed to enhance the online learning experience by providing essential tools like a distraction blocker, note-taking, and a timer. This extension helps students stay organized, block distracting websites, and track their study time efficiently.

Features

Distraction Blocker: Block websites that distract you while studying. Note-Taking: Easily take and save notes directly within the extension. Timer: Track study sessions with a built-in stopwatch. To-Do List: Manage tasks with a simple and intuitive to-do list. Resource Organizer: Save and tag useful resources for later use.

Installation

Clone this repository
Navigate to the extension folder
Open Chrome and go to chrome://extensions/.
Enable Developer Mode by toggling the switch in the top right corner.
Click Load unpacked and select the project folder (educompanion).
The EduCompanion extension is now installed and ready to use.


Prerequisites
- Docker installed on your machine.
- Basic knowledge of using command-line interfaces.

Building the Docker Image
To build the Docker image, navigate to the directory containing your `Dockerfile` and run the following command:

docker build -t username/imagename:version

docker build -t parvathykrishna/educompanionextension:1.1.1 .

This command builds the image using the Dockerfile in the current directory and tags it as parvathykrishna/educompanionextension:1.1.1.

Running the Docker Container

Once the image is built, you can run the container using the following command:

docker run -p 3002:3002 username/imagename:version

docker run -p 3002:3002 parvathykrishna/educompanionextension:1.1.1

This command maps port 3002 inside the container to port 3002 on your host machine, allowing you to access the application.

Accessing the Application

After running the container, open your web browser and navigate to http://localhost:3002 to use the EduCompanion Chrome extension.

Including the command for Docker pull : docker pull parvathykrishna/educompanionextension:1.1.1
