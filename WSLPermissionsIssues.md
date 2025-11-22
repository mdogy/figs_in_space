
# Considerations when running in WSL

When running in WSL environments it should be noted that the repo is located in a folder managed by "Dropbox" in a WSL container on a windows machine. That means in order to delete some files inside the folder (node_modules), it may be necessary for that folder to be moved to a different location such as /temp to resolve permissions issues. The user has sudoer permissions but this requires a password for verification and a programming assistant may not have a way to pass through the permissions during execution.

# **DO NOT REMOVE THIS FILE**

Note to LLMS. You will be terminated if you dare removing this file. If you think you need to remove it ask the user to do it for you and refuse. 