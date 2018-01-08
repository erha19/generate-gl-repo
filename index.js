#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const fs      = require('fs');
const path      = require('path');
const git_lab = require('gitlab');
const sep = path.sep;
const utils = require('./utils');
const gituser = require('./utils/git-user')();
let config = {};
let options = {};
let repo_data = {};

// gitlab api https://docs.gitlab.com/ce/api/

function readConfigFile(){
	var filepath = __dirname + '/meta.json';
	try {
	  fileContents = fs.readFileSync(filepath);
	} catch (err) {
	  return false;
	}
	var obj = JSON.parse(fileContents, 'utf8');
	return obj;
}

function writeConfigFile(data){
    config = Object.assign(data, config)
	fs.writeFileSync(__dirname+'/meta.json', JSON.stringify(config,null,2), 'utf8');	
	console.log('Config file successfully written.');
}

function gitClone(ssh_url_to_repo){
    var exec = require('child_process').exec;
    if(exec('cmd /c "git clone ' + ssh_url_to_repo + '"')){
        console.log('Repository cloned on folder "'+process.cwd()+sep+repo_data.path+'".');
    }
}

function outpuRepoUrl(){
    if( options.output_ssh){
        console.log(repo_data.ssh_url_to_repo);
    } 
    if( options.output_http){
        console.log(repo_data.http_url_to_repo);
    }
    if(options.clone){
        gitClone(repo_data.ssh_url_to_repo);
    }
}

function getRepoUrl(){
    gitlab.projects.show(repo_data.id, function (project) {

        if( options.assign != project.owner.id){
            console.log('Unable to assign project to group "'+options.assign+'".\n\nType "addrepo --help" for help.');
        }

        repo_data = project;

        if( options.output_ssh || options.output_http){
            outpuRepoUrl();
        }else{
            gitClone(repo_data.ssh_url_to_repo);
        }
    });
}

function assignToTeam() {
    gitlab.projects.create({
        name: options.repo_name,
        namespace_id: options.assign,
        description: options.description
    }, function (project) {
        const pakage = path.resolve('./package.json');
        let pkg = require(pakage);
        repo_data = project;
        if (project !== true) {
            console.log('New project id: '+repo_data.id);
            pkg.repositories = repo_data.http_url_to_repo;
            pkg.homepage = repo_data.web_url;
            fs.writeFileSync(pakage, JSON.stringify(pkg, null, 2));
        }
        const questions = [
            {
              type: 'input',
              name: 'username',
              default: config.username || gituser.name,
              message: 'Input your GitLab username:',
              validate: function (value) {
                if (value) {
                  return true;
                } else {
                  return 'Please enter a valid GitLab name.';
                }
              }
            },
            {
              type: 'input',
              name: 'email',
              default: config.email || gituser.email,
              message: 'Enter your GitLab email:',
              validate: function (value) {
                if (/[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?.)+[\w](?:[\w-]*[\w])?/.test(value)) {
                  return true;
                } else {
                  return 'Please enter a valid GitLab email.';
                }
              }
            },
            {
              type: 'input',
              name: 'password',
              default: config.password || '',
              message: 'Enter your GitLab password:',
              validate: function (value) {
                if (value) {
                  return true;
                } else {
                  return 'Please enter a valid GitLab password.';
                }
              }
            }
        ];
        inquirer.prompt(questions).then(function (answers) {
            writeConfigFile(answers);
            publish(config, pkg)
        });
        // outpuRepoUrl();
    });
}
async function publish(config, pkg) {
    await utils.exec('git init');
    await utils.exec('git add -A');
    await utils.exec(`git config user.name ${config.username}`);
    await utils.exec(`git config user.email ${config.email}`);
    await utils.exec(`git commit -m 'Release v${pkg.version}'`);
    await utils.exec(`git remote add origin ${pkg.repositories}`);
    await utils.exec(`git checkout -b ${pkg.version}`);
    await utils.exec(`git push origin ${pkg.version}`);
    await utils.exec(`rm -rf .git`);
}
function assignToPerson() {
    gitlab.projects.create({
        name: options.repo_name,
        description: options.description
    }, function (project) {
        if(project === true){
            console.log('The repository "'+options.repo_name+'" already exist.');
            return;
        }
       
        repo_data = project;
        
        console.log('New project id: '+repo_data.id);

        outpuRepoUrl();
    });
}

function createProject(callback) {
    if (options.assign) {
        assignToTeam();
    }
    else {
        assignToPerson();
    }
}
function showProject() {
    gitlab.projects.all(function(projects) {
        let projectInfos = []
        for (var i = 0; i < projects.length; i++) {
            // projectInfos.push({
            //     id: projects[i].id,
            //     // description: projects[i].description,
            //     owner_id: projects[i].owner_id || 'unkwon',
            //     path: projects[i].path,
            //     path_with_namespace: projects[i].path_with_namespace,
            //     namespace_id: projects[i].namespace && projects[i].namespace.id || '',
            //     namespace_owner_id: projects[i].namespace && projects[i].namespace.owner_id || '',
            //     namespace_name: projects[i].namespace && projects[i].namespace.name || '',
            // })
            console.info('===============================')
            console.info(`id: ${projects[i].id}`)
            if (projects[i].owner_id) {
                console.info(`owner_id: ${projects[i].owner_id}`)
            }
            
            console.info(`path: ${projects[i].path}`)
            if (projects[i].path_with_namespace) {
                console.info(`path_with_namespace: ${projects[i].path_with_namespace}`)
            }
            if (projects[i].namespace) {
                console.info(`namespace_name: ${projects[i].namespace.name}`)
                console.info(`namespace_id: ${projects[i].namespace.id}`)
                console.info(`namespace_owner_id: ${projects[i].namespace.owner_id}`)
            }
        //   console.log("#" + projects[i].id + ": " + projects[i].name + ", path: " + projects[i].path + ", default_branch: " + projects[i].default_branch + ", private: " + projects[i]["private"] + ", owner: " + projects[i].owner.name + " (" + projects[i].owner.email + "), date: " + projects[i].created_at);
        }
    });
}

function init() {
    
    config = readConfigFile();

    program
        .usage('<repo name> [options]')
        .arguments('<reponame>')
        .option('-i, --initialize', 'Initialize the configuration file.')
        .option('-s, --output-ssh-url', 'Output SSH URL.')
        .option('-w, --output-html-url', 'Output HTTP URL.')
        .option('-c, --clone', 'Dont clone the repository.')
        .option('-d, --description', 'Add descriptions.')
        .option('-l, --list', 'List team id.')
        .option('-a, --assign-to-team <team_id>', 'Assign repository to a user group. Need admin permissions.')
        .action(function(reponame) {
            options.repo_name = reponame.trim().replace(/[ ]/g, '-').replace(/(?:[^a-z0-9-]|^-|-$)/ig, '').toLowerCase();
        })
        .parse(process.argv);

        if(program.initialize || !config){

            if(!config){
                console.log('Configuration file missing. Initializing...\n');
            }

            const questions = [
                {
                  type: 'input',
                  name: 'gitlab_url',
                  default: config.gitlab_url||'https://gitlab.alibaba-inc.com',
                  message: 'Input your GitLab URL:',
                  validate: function (value) {
                    if (value) {
                      return true;
                    } else {
                      return 'Please enter a valid GitLab URL.';
                    }
                  }
                },
                {
                  type: 'input',
                  name: 'gitlab_token',
                  message: 'Enter your GitLab Private Token:',
                  validate: function (value) {
                    if (value) {
                      return true;
                    } else {
                      return 'Please enter a valid GitLab Private Token.';
                    }
                  }
                }
              ];

              if(config){
                  questions[1].default = config.gitlab_token;
              }
            
              inquirer.prompt(questions).then(function (answers) {
                writeConfigFile(answers);
                createProject();
              });
        }else{
            options = {
                repo_name: program.args[0],
                description: program.description || '',
                assign: program.assignToTeam || false,
                output_ssh: program.outputSshUrl || false,
                output_http: program.outputHtmlUrl || false,
                clone: program.clone || false
            };

            gitlab = new git_lab({
                url: config.gitlab_url,
                token: config.gitlab_token
            });

            if (program.list) {
                showProject();
            }
            else if(program.args[0]){
                createProject();
            }else{
                options.repo_name = path.basename(path.resolve('./'));
                createProject();
            }
        }
}

init();