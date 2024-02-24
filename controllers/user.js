const User = require('../models/user');

module.exports.usernameToLowerCase = (req,res,next) =>  {
    // convert username to lowercase
    req.body.username = req.body.username.toLowerCase();
    next();
}

module.exports.renderRegisterForm = (req,res) => {
    res.render('users/register', { flashWidth:'small' });
};

module.exports.register = async(req,res,next) => {
    try {
        let {email,displayname,username,password} = req.body;
        username = username.toLowerCase();
        const user = new User({username,email,displayname});
        const registeredUser = await User.register(user,password);
        await req.login(registeredUser, err => {
            if(err) {
                return next(err);
            }
            req.flash('success','Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        });
    } catch(e) {
        req.flash('error',e.message);
        res.redirect('register');
    }
};

module.exports.renderLoginForm = (req,res) => {
    res.render('users/login', { flashWidth:'small' });
};

module.exports.login = (req,res) => {
    req.flash('success','Welcome back');
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    delete res.locals.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success','Goodbye!');
        res.redirect('/campgrounds');
    })
};

module.exports.renderEditForm = (req, res) => {
    const userId = req.user._id;
    res.render('users/edit',{currentUser: res.locals.currentUser, flashWidth:'small'});
};

module.exports.update = async (req,res,next) => {
    const {_id,username,email,displayname = '' } = req.body;
    const user=await User.findById(_id,(err, user) => {
        if (err) {
            req.flash('error',`I shouldn't have reached that at profile - edit (${err})`);
        }

        if (!user) {
            req.flash('error','no account found???');
            return res.redirect('/edit');
        }
        user.username=username;
        user.displayname=displayname || '';
        user.email=email;
        user.save(function (err) {
            if (err) {
                req.flash('error',`I shouldn't have reached that at profile - edit, save (${err})`);
            }
            req.flash('success','User profile updated!');
            res.redirect('/campgrounds');
        });
    });
};

// #region change-password
module.exports.renderChangePasswordForm = (req, res) => {
    const userId = req.user._id;
    res.render('users/change-password',{currentUser: res.locals.currentUser, flashWidth:'small'});
};

module.exports.changePassword = async (req,res,next) => {
    const {_id,username,password,newPassword1,newPassword2 } = req.body;
    const user=await User.findById(_id,async (err, user) => {
        if (err) {
            req.flash('error',`I shouldn't have reached that at profile - change password (${err})`);
        }

        if (!user) {
            req.flash('error','no account found???');
            return res.redirect('/change-password');
        }
        if (newPassword1 === newPassword2) {
            await user.changePassword(password,newPassword1,(err) => {
                if (err) {
                    req.flash('error',`Password change failed (${err})`);
                    return res.redirect('/change-password');
                } else {
                    req.flash('success','Password successfully changed');
                    return res.redirect('/edit');
                }
            })
            
        } else {
            req.flash('error','passwords do not match');
            return res.redirect('/change-password');
        }
    });
};
// #endregion change-password
