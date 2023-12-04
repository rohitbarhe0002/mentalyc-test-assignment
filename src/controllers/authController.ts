import bcrypt from "bcryptjs";
import User from '../models/User';
type RequestType = {
  username: string;
  password: string;
};

const authController = {
  async login(req: any, res: any) {
    const { username,password } = req.body;
  try {
    const user = await User.findOne({ username: username });
    const isPasswordChecked = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordChecked) {
      return res.status(404).json({ errorMessage: "password is not matched" });
    }
     // Set the cookie and send the response in one go
    req.session.loggedIn = true;
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json(err);
  }


},

async logout(req, res) 
{    try {     
   // destroy the session  to log out the user 
   req.session.destroy();
   res.json({ message: 'Logout successful' });

   // Add cache-control headers to prevent caching
         } 
        catch (err) {     
           res.status(500).json({ error: "An error occurred while logging out" });    } 
       }
       ,};


export default authController;

