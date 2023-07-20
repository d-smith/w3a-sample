const knex = require('./../db')

const getSecretForUser = async (req, res) => {
    console.log('getSecretForUser');
    console.log(req.params);
    knex.select('secret').from('users').where('email', req.params.id).then(function(secret) {
        console.log(secret);
        res.json(secret);
    })
    .catch((error) => {
        res.json({message: `There was an error getting the secret: ${error}`});
    });
};

const putSecretForUser = async (req, res) => {
    console.log('putSecretForUser');
    console.log(req.body);
    let user = req.params.id;
    knex.insert({email: user, secret: req.body.secret}).into('users').then(function(id) { 
        console.log('inserted');
        res.json({id: user});
    })
    .catch((error) => {
        res.json({message: `There was an error storing the secret: ${error}`});
    });
};

const deleteSecretForUser = async (req, res) => {
    console.log('deleteSecretForUser');
    console.log(req.params);
    knex('users').where('email', req.params.id).del().then(function() {
        console.log('deleted');
        res.json({message: `Secret deleted`});
    })
    .catch((error) => {
        res.json({message: `There was an error deleting the secret: ${error}`});
    });
};

module.exports = {
    getSecretForUser,
    putSecretForUser,
    deleteSecretForUser
}