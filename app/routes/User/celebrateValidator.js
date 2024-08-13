const { celebrate, Joi, Segments } = require('celebrate');

const addUser = celebrate({
    [Segments.BODY]: Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phoneNumber: Joi.string().required().pattern(/^[0-9]+$/)
       })
},{ warnings: true })

const login=celebrate({
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required()
       })
},{ warnings: true })

const updateUserData=celebrate({
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        phoneNumber: Joi.string().required().pattern(/^[0-9]+$/)
       })
},{ warnings: true })

module.exports = { 
    addUser,
    login,
    updateUserData 
};



