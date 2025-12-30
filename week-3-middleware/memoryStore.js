global.user_id = null;
global.users = [];
global.tasks = [];

global.storedUsers = [];
global.setLoggedOnUser = () => {};
module.exports = {
  get user_id() {
    return global.user_id;
  },
  set user_id(val) {
    global.user_id = val;
  },
  users: global.users,
  tasks: global.tasks,
  storedUsers: global.storedUsers,
  setLoggedOnUser: global.setLoggedOnUser,
};
