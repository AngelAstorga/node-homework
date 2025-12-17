global.user_id = null;
global.users = [];
global.tasks = [];

global.storedUsers = [];
global.setLoggedOnUser = () => {};
module.exports = {
  users: global.users,
  tasks: global.tasks,
  user_id: global.user_id,
  storedUsers: global.storedUsers,
  setLoggedOnUser: global.setLoggedOnUser,
};
