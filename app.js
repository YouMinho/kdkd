const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer')
const session = require('express-session');

const app = express();
const http = require('http').Server(app);
//var upload = multer({ dest: 'uploads/' });

var sign_up_err=0;

app.locals.pretty = true;
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: true
}));

app.use(function(req, res, next) {
    res.locals.user = req.session;
    next();
});

app.set('views', './views');
app.set('view engine', 'ejs');

//-----------DB------------------
const pool = mysql.createPool({
    host: '183.101.196.138',
    user: 'kdkd',
    password: 'kdkd',
    database: 'kdkd',
    port: 3306,
    connectionLimit: 20,
    waitForConnection: false
});
http.listen(8888, () => {
    console.log('8888 port opened!!!');
})
//-----------DB------------------

app.get('/', (req, res) => {
    const sess = req.session;
    if(sess.userid) {
        res.render('home');
    }
    else {
        res.render('user/login');
    }
});

app.get('/login', (req, res) =>{
    const sess = req.session;
    res.render('user/login', { pass: true });
});

app.post('/login', (req, res) => {
    const sess = req.session;
    let values = [req.body.username, req.body.password];
    let login_query = `
    select *
    from user
    where id=? and password=?;
    `;
    pool.getConnection((err, connection) => {
        connection.query(login_query, values, (err, results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            if (results.length == 1) {
                sess.userid = results[0].id;
                sess.name = results[0].name;
                sess.grade = results[0].grade;
                req.session.save(() => {
                    connection.release();
                    res.redirect('/');
                });
            } else {
                connection.release();
                res.render('user/login', { pass: false });
            }
        })
    });
});

app.get('/mypage', (req, res) =>{
    let userid = req.session.userid;
    let user_data_query = `
        select *
        from user
        where id = ?
    `;
    pool.getConnection((err, connection) =>{
        connection.query(user_data_query, [userid], (err, results, fields) =>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.render('user/mypage', {article : results[0]});    
        });
    });
});

app.get('/logout', (req, res) =>{
    const sess = req.session;
    sess.destroy();
    res.redirect('/login');
});

app.get('/home', (req, res) =>{
    res.render('home');
});

app.get('/notice', (req, res) =>{
    res.render('notice/notice');
});

app.get('/board', (req, res) =>{
    res.render('board/board');
});

app.get('/calendar', (req, res) =>{
    res.render('calendar/calendar');
});

app.get('/inout', (req, res) =>{
    res.render('inout/inout');
});

app.get('/admin', (req, res) =>{
    let class_values = ["햇님반", "별님반", "달님반", "꽃님반"];
    let select_student = `
    select id, name, class, date_format(birth, '%Y-%m-%d') as birth, rfid_key
    from student 
    where class = ?`

    pool.getConnection((err, connection) => {
        connection.query(select_student, class_values[0], (err, result1)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_student, class_values[1], (err, result2)=>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                connection.query(select_student, class_values[2], (err, result3)=>{
                    if (err) {
                        console.log(err);
                        connection.release();
                        res.status(500).send('Internal Server Error!!!')
                    }
                    connection.query(select_student, class_values[3], (err, result4)=>{
                        if (err) {
                            console.log(err);
                            connection.release();
                            res.status(500).send('Internal Server Error!!!')
                        }
                        connection.release();
                        res.render('admin/admin', {student1: result1, student2: result2, student3: result3, student4: result4});
                    });
                });
            });
        });
    });
    
});

app.get('/admin/student_add', (req, res) =>{
    res.render('admin/student_add');
});

app.post('/admin/student_add', (req, res) =>{
    let classname = req.body.classname;
    let name = req.body.name;
    let birth = req.body.birth;
    let rfid = req.body.rfid;
    
    let values = [classname, name, birth, rfid];
    let student_insert = `
    insert into student (class, name, birth, rfid_key)
    values(?, ?, ?, ?)`;

    pool.getConnection((err, connection) => {
        connection.query(student_insert, values, (err, result)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/admin'); 
        });
    });
});

app.get('/admin/student_modify/:num', (req, res) =>{
    var num = req.params.num;
    let select_student = `
    select id, name, class, date_format(birth, '%Y-%m-%d') as birth, rfid_key
    from student 
    where id = ?
    `;

    pool.getConnection((err, connection) => {
        connection.query(select_student, num, (err, result)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.render('admin/student_modify', {student: result[0]});
        });
    });
});

app.post('/admin/student_modify/:num', (req, res) => {
    var num = req.params.num;
    let classname = req.body.classname;
    let name = req.body.name;
    let birth = req.body.birth;
    let rfid = req.body.rfid;

    let values = [classname, name, birth, rfid, num];
    let student_update = `
    update student
    set class=?, name=?, birth=?, rfid_key=?
    where id=?
    `;
    pool.getConnection((err, connection) => {
        connection.query(student_update, values, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.release();
            res.redirect('/admin');
        });
    });
});

app.get('/signup', (req, res) =>{
    let get_id =`
        select id
        from user
    `;
    let ids = new Array();
    pool.getConnection((err, connection) => {
        connection.query(get_id, (err, results, fields)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            
            for(var i =0; i<results.length; i++)
                ids.push(results[i].id);
            if(sign_up_err==1)
                msg="정보가 없습니다";
            else
                msg="정확하게 입력해주세요";
            sign_up_err = 0;
            connection.release();
            res.render('user/signup', {ids : ids, msg:msg});    
        });    
    });
});
app.post('/signup', (req, res)=>{
    let id = req.body.id;
    let name = req.body.name;
    let password = req.body.pass;
    let emailid = req.body.emailid;
    let emaildomain = req.body.emaildomain;
    let tel1 = req.body.tel1;
    let tel2 = req.body.tel2;
    let tel3 = req.body.tel3;
    let addr1 = req.body.addr1;
    let addr2 = req.body.addr2;
    let addr3 = req.body.addr3;
    let cln1 = req.body.cln1;
    let cln2 = req.body.cln2;

    let values = [id, password, "P", name, emailid, emaildomain, tel1, tel2, tel3, addr1, addr2, addr3];
    let values_relation = [cln1, cln2];
    let user_insert = `
    insert into user (id, password, grade, name, emailid, emaildomain, tel1, tel2, tel3, zip_code, address, detail_address)
    values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    let select_student = `
    select * from student 
    where class = ? and
    name = ?`
    let relation_insert = `
    insert into relation (student_id, parents_id)
    values(?, ?)`;
    pool.getConnection((err, connection) => {
        connection.query(user_insert, values, (err, result)=>{
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }
            connection.query(select_student, values_relation, (err, result)=>{
                if (err) {
                    console.log(err);
                    connection.release();
                    res.status(500).send('Internal Server Error!!!')
                }
                if(result.length > 0){
                    let kim = [result[0].id, id];
                    connection.query(relation_insert, kim, (err, result)=>{
                        connection.release();
                        res.redirect('/login');
                    });
                }else{
                    sign_up_err=1;
                    connection.release();
                    res.redirect('/signup');
                }    
            });        
        });
    });
});

app.get('/pw', (req, res) =>{
    res.render('user/pw', {msg: "정확하게 입력하세요"});
});
app.post('/pw', (req, res) =>{
    const sess = req.session;

    let name = req.body.name;
    let emailid = req.body.emailid;
    let emaildomain = req.body.emaildomain;

    let values = [name, emailid, emaildomain];
    let find_idpw_query = `
    select *
    from user
    where name=? and emailid=? and emaildomain=?;
    `;
    pool.getConnection((err, connection) => {
        connection.query(find_idpw_query, values, (err, results) => {
            if (err) {
                console.log(err);
                connection.release();
                res.status(500).send('Internal Server Error!!!')
            }

            if (results.length == 1) {
                sess.userid = results[0].id;
                sess.name = results[0].name;
                sess.grade = results[0].grade;
                req.session.save(() => {
                    connection.release();
                    res.redirect('/mypage');
                });
            } else {
                connection.release();
                res.render('user/pw', { msg: "등록된 계정이 없습니다." });
            }
        });
    });
});