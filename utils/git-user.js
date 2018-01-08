const exec = require('child_process').execSync

module.exports = () => {
  let name
  let email

  try {
    name = exec('git config --get user.name')
    email = exec('git config --get user.email')
  } catch (e) {}

  trim_name = name && JSON.stringify(name.toString().trim()).slice(1, -1)
  trim_email = email && (' <' + email.toString().trim() + '>')
  return {
    author: (trim_name || '') + (trim_email || ''),
    email: email.toString().trim(),
    name: name.toString().trim()
  }
}
