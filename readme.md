# generate-gl-repo

Minimal CLI wrapper for [node-gitlab] package to easy creating new repositories on a GitLab server and clone it locally, all in a single command.

```
gen my-new-repository
```

>**IMPORTANT**: You must to have an SSH key properly configured on your local machine and on the GitLab server in order to be able to clone the repository after is has been created.


## Options


  Usage: gen <repo name> [options]


  Options:

    -i, --initialize                Initialize the configuration file.
    -s, --output-ssh-url            Output SSH URL.
    -w, --output-html-url           Output HTTP URL.
    -n, --clone-no                  Dont clone the repository.
    -a, --assign-to-team <team_id>  Assign repository to a user group. Need admin permissions.
    -h, --help                      output usage information


## Install

```
npm install generate-gl-repo -g
```
>**Note**: You must install this package globally to be able to use it anywhere from the CLI.


## Configuration

Use this command to initialize the configuration process:
```
gen -i
``` 

The configuration process will ask you:
1. Your GitLab server domain name. Ex.: http://gitlab.com
2. Your Private Token number.

>A JSON configuration file named **addrepo.json** will be saved on the package install folder at ```%APPDATA%\npm\node_modules\addrepo```.

## How to use

### Initialize the configuration file
```
gen -i
```

### Create a new repository
```
gen my-new-repository
```
>**Note**: If there is already a repository with the same name for the current user, the action will fail. 

### Create a repository, dont clone it, and output the HTTP URL
```
gen my-new-repository -n -w
```

### Create a repository, and assign it to a user group by ID number

This option require admin permissions in the configured user.

You can run `gen -l` to see all the namespace info.

```
gen my-new-repository -a [namespace_id]
```

Or `cd  my-new-repository && gen -a [namespace_id]`

>**Note**: If the current user don't have permissions to assign a project to a group, the project will be created for the current user.


[node-gitlab]: https://github.com/node-gitlab/node-gitlab

