const knex = require('./../db')

const getShareForUser = async (req, res) => {
    console.log('getShareForUser');
    console.log(req.params);
    knex.select('share').from('shares').where('email', req.params.id).then(function(share) {
        console.log(share);
        res.json(share);
    })
    .catch((error) => {
        res.json({message: `There was an error getting the share: ${error}`});
    });
};

const putShareForUser = async (req, res) => {
    console.log('putShareForUser');
    console.log(req.body);
    let user = req.params.id;
    knex.insert({email: user, share: req.body.share}).into('shares').then(function(id) {    
        console.log('inserted');
        res.json({id: user});
    })
    .catch((error) => {
        res.json({message: `There was an error storing the share: ${error}`});
    });
};

const deleteShareForUser = async (req, res) => {
    console.log('deleteShareForUser');
    console.log(req.params);
    knex('shares').where('email', req.params.id).del().then(function() { 
        console.log('deleted');
        res.json({message: `Share deleted`});
    })
    .catch((error) => {
        res.json({message: `There was an error deleting the share: ${error}`});
    });
};


module.exports = {
    getShareForUser,
    putShareForUser,
    deleteShareForUser  
}