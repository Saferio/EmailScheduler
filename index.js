const express = require("express")
const mongoose = require("mongoose")
const path = require('path')
const hbs = require('hbs')
const sgMail = require('@sendgrid/mail')
const api_key="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"
let Details = require("./models/Details")
const cron = require('node-cron');

const app = express()
const port = process.env.PORT||3001

sgMail.setApiKey(api_key)
// userName: Saferio
// mongopass : emailapp
mongoose.connect("mongodb+srv://Saferio:emailapp@cluster0.srxui.mongodb.net/EmailApp?retryWrites=true&w=majority",{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:false
})
let db = mongoose.connection

db.once('open', () => {
    console.log("Connected to db")
})

db.on('error', (err) => {
    console.log(err)
})
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const publicPathDir = path.join(__dirname, "./public")
const viewsPath = path.join(__dirname, "./templates/views")
const partialsPath = path.join(__dirname, "./templates/partials")


app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
hbs.registerHelper('ifCond', (v1, v2, options) => {
    if(v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
app.use(express.static(publicPathDir))


app.get('/',async(req, res) => {
    await Details.find({status:{ $ne: 2 }}, (err, details) => {
        if (err) {
            console.log(err)
        } else {
            // console.log(details)
            res.render('index', {
                title: 'Email List Page',
                name:"John Saferio",
                details
            })
        }

    })

   
})

app.get('/add', (req, res) => {

    res.render('add', {
        title: 'Email Add Page',
        name:"John Saferio"
    })
})

app.get('/edit/:id', (req, res) => {
    Details.findById(req.params.id, (err, details) => {
        if (err) {
            console.log(err)
        } else {
            // console.log(details)
            let email=""
            if(details.emaiId.length>1)
            {
                details.emaiId.forEach((item, index)=>{
                    if(index==0)
                    {
                        email+=item
                    }
                    else
                    {
                        email+=`,${item}`
                    }
                });
            }
            else
            {
                email =details.emaiId[0]
            }
            console.log(email)
            res.render('edit', {
                title: 'Email data edit Page',
                name:"John Saferio",
                details,
                email
            })
        }

    })
})

app.post('/details/add', async(req, res) => {

    let details = new Details();
    let emailString=req.body.emailAddress
    let emails = emailString.split(",");
    details.time=req.body.datetime
    details.subject=req.body.subject
    details.text=req.body.text
    details.emaiId=emails

    await details.save((err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect('/')
        }
    })

    // res.status(200).send()
})

app.post('/edit/:id', (req, res) => {
    let details = {}
    let emailString=req.body.emailAddress
    let emails = emailString.split(",");
    details.time=req.body.datetime
    details.subject=req.body.subject
    details.text=req.body.text
    details.emaiId=emails

    // let query = { _id: req.params.id }
    Details.findByIdAndUpdate(req.params.id, details, (err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect('/')
        }
    })
})

app.post('/delete/:id',async (req, res) => {
    let details = {}
    details.status=2

    // let query = { _id: req.params.id }
    await Details.findByIdAndUpdate(req.params.id, details, (err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect('/')
        }
    })
})

cron.schedule('* * * * *', async()=>{
   await Details.find({status:{ $ne: 2 }}, (err, details) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Cron runs")
            details.forEach((element)=>{
                // console.log(element.time)
                // console.log(new Date())
                if(element.status==0)
                {
                    if(element.time<=new Date())
                    {
                        const msg = {
                            to: element.emaiId, // Change to your recipient
                            from:{
                                email: 'noreplymanagementsystem@gmail.com',
                                name: 'No Reply Big App Company'
                            },
                            subject: element.subject,
                            text: element.text
                          }
                        sgMail
                          .send(msg)
                          .then(() => {
                            console.log('Email sent')
                            let details = {}
                            details.status=1
                            Details.findByIdAndUpdate(element._id, details, (err) => {
                                if (err) {
                                    console.log(err);

                                } else {
                                    console.log("Updated Status");
                                }
                                
                                })
                            })
                          .catch((error) => {
                            console.error(error)
                          })
                        // console.log(msg)
                        // console.log("Send Mail")
                    }
                }
                
            })
        }
    })
});

app.listen(port,()=>{
    console.log(`Server is up on port ${port}`)
})