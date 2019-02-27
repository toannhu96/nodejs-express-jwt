const User = require('../../models/User');
const authService = require('../../services/auth.service');
const bcryptService = require('../../services/bcrypt.service');

const processError = (err, req, res) => {
  if (err.original.code === 'ER_DUP_ENTRY') {
    const { body } = req;
    return res.status(500).json({ msg: `User with email: ${body.email} already exists.` });
  }
  return res.status(500).json({ msg: 'Internal server error' });
};

const UserController = () => {
  const register = (req, res) => {
    const { body } = req;

    return User
      .create({
        email: body.email,
        password: body.password,
      })
      .then((user) => {
        const token = authService.issue({ id: user.id });
        return res.status(200).json({ token, user });
      })
      .catch((err) => processError(err, req, res));
  };

  const login = (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
      User
        .findOne({
          where: {
            email,
          },
        })
        .then((user) => {
          if (!user) {
            return res.status(400).json({ msg: 'Bad Request: User not found' });
          }

          if (bcryptService.comparePassword(password, user.password)) {
            const token = authService.issue({ id: user.id });

            return res.status(200).json({ token, user });
          }

          return res.status(401).json({ msg: 'Unauthorized' });
        })
        .catch((err) => {
          console.log(err);
          return res.status(500).json({ msg: 'Internal server error' });
        });
    }
  };

  const validate = (req, res) => {
    const { token } = req.body;

    authService
      .verify(token, (err) => {
        if (err) {
          return res.status(401).json({ isvalid: false, err: 'Invalid Token!' });
        }
        return res.status(200).json({ isvalid: true });
      });
  };

  const getAll = (req, res) => {
    User
      .findAll()
      .then((users) => res.status(200).json({ users }))
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ msg: 'Internal server error' });
      });
  };


  return {
    register,
    login,
    validate,
    getAll,
  };
};

module.exports = UserController;