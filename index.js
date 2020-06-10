/*js交互部分*/
const   {querySelector,querySelectorAll} = document,
        {log} = console,
        $ = querySelector.bind(document),
         _$ = querySelectorAll.bind(document);
const   container = $('.container'),
        level_li = _$('.level>li'),
        cover = $('.cover'),
        game = $('.game'),
        socr_span = $('.score >span'),
        lastscore = $('.lastscore >span'),
        honorary  = $('.honorary>span');
       
const Score = new Proxy({grade : 0},{
    set(targe, props, value){
        targe[props] = value;
        socr_span.innerText = value;  
    }
});

let fire_timer = null,//创造子弹的定时器
    enemy_timer = null;//创造敌人的定时器     
/*
    开发步骤：
    一.点击不同的难度：
        1.让cover消失，让game显示出来，同时给game设置背景图片

    二.开始游戏
        根据游戏游戏难度，确定：
            1.生成战机,确定位置 
            2.发射子弹
            3.生成敌机
*/

 //遍历level_list给每个元素绑定点击事件
level_li.forEach((item , index ) => {
    item.onclick = e => {
        e.stopPropagation();
        cover.style.display= 'none';
        game.style.backgroundImage = `url(./images/bg_${index + 1}.jpg)`;
        const x = e.clientX - container.offsetLeft,
              y = e.clientY - container.offsetTop;
        game_start(index, {x,y});   //点击开始游戏函数 参数：index[难度下标],{x,y}[鼠标点击下去的位置]
    }
});

function game_start(level, options){
    let {x,y} = options;  //把水平方向和竖直方向的坐标从options里边解构出来
    //生成英雄战机并让英雄战机的中心点对着鼠标的中心点
    x -= 70 / 2;
    y -= 70 / 1.2;
    const hero = new Image();
    hero.setAttribute('src', './images/plane_0.png');
    hero.setAttribute('class', 'hero');
    hero.style.cssText = `position: absolute;width:70px;height:70px;transform:matrix(1,0,0,1,${x},${y});`;
    game.append(hero);

    //当鼠标移动的时候，移动飞机
    document.addEventListener('mousemove',e => {  
        let x = e.clientX - container.offsetLeft - 70 / 2,
            y = e.clientY - container.offsetTop - 70 / 1.2;
        //限制x和y的值，不让飞机跑出地图之外
        //在限定最大值和最小值的时候，min套max
        x = Math.min(Math.max(x, 0 - hero.offsetWidth / 2), game.offsetWidth - hero.offsetWidth / 2);
        y = Math.min(Math.max(0, y), game.offsetHeight - 21 - hero.offsetHeight / 1.5);
        hero.style.transform = `matrix(1,0,0,1,${x},${y})`;
    });

    //创造英雄战机并且发射子弹
    fire(level , hero);   // 参数：[level 难度选择  hero 战机]
    //创造敌机函数
    enemy(level);
}

function fire(level , hero){
    const time_list = [150 , 80 , 50 , 25];  //子弹发射的时间频率
    fire_timer =setInterval(()=>{
       //判断分数，如果分数高于500分，那么发射两条子弹
        if( Score.grade >= 500 ){
            bullet(hero, 1);
            bullet(hero, -1);
        }else{
            bullet(hero, 0);
        }
    },time_list[level]);   //通过定时器来生成多发连续的子弹
}

function bullet(hero,offset){
    let [x,y] = getTransformStyle(hero);
    const bullets = new Image();
    bullets.setAttribute('src', './images/fire.png');
    bullets.setAttribute('class', 'bullet');
    bullets.style.cssText = `
        position: absolute;
        width:30px;
        height:30px;
        transform:matrix(1,0,0,1,${x+hero.offsetWidth/3.5 + offset * 15},${y-10});
        `;
    game.append(bullets);
    requestAnimationFrame(hero_move);
    function hero_move(){
        let [x,y] = getTransformStyle(bullets);
        if(y < -(21+bullets.offsetHeight)){
            game.removeChild(bullets);
            return;
        }
        bullets.style.transform = `matrix(1,0,0,1,${x},${y-20})`;
        requestAnimationFrame(hero_move);
    }
}

function getTransformStyle(ele){
    const style = getComputedStyle(ele).transform.slice(7,-1).split(',');
    return [parseFloat(style[4]),parseFloat(style[5])];
}

/* 
    30的倍数生成大敌机，不是的生成小敌机
    生成敌机步骤：
        1.new 一个敌机： 根据难度选择
        2.给敌机添加属性
            a.速度
            b.血量
        3.动态获取敌机宽高：根据大小敌机来设置
        4.添加敌机到game中
        5.生成多个敌机 ：用定时器
        6.敌机移动 ：js动画
*/

function enemy(level){
    let num = 1;
    const   enemys_arr = ['big','small'],
            hp_list = [20 , 1],   //血量属性
            speed_list = [5,6,7,8],  //速度属性
            w_list = [80,54],       //敌机宽
            h_list = [104 , 40],        //敌机高
            createEnemyTime = [500 , 350 , 200, 150];  //生成敌机频率

    enemy_timer = setInterval(() => {
        createEnemy();
    }, createEnemyTime[level]);   //通过定时器生成多个敌机
    
    function createEnemy(){
        let index = num%30 ? 1 : 0;  //根据index 来判断大小敌机，返回1是大敌机 ，返回0是小敌机；
        const enemys = new Image();
        enemys.setAttribute('src',`./images/enemy_${enemys_arr[index]}.png`);  //添加敌机
        enemys.setAttribute('hp',`${hp_list[index]}`);                         //给敌机添加血量属性
        enemys.setAttribute('speed',`${speed_list[level]}`);                    //给敌机添加速度属性
        enemys.setAttribute('width',`${w_list[index]}`);                        //敌机宽度
        enemys.setAttribute('height',`${h_list[index]}`);   
        enemys.setAttribute('class','enemys');                      //敌机高度
        //随机生成敌机的位置->随机改变移动的水平距离  高度初始位置位于屏幕的上方
        enemys.style.cssText = `position: absolute; 
        transform: matrix(1, 0, 0, 1, ${game.offsetWidth * Math.random() - enemys.width/4}, ${-(21 + enemys.width / 3)});`;
        game.append(enemys);
        num++;  

        requestAnimationFrame(enemys_move);     //js动画
        function enemys_move(){                     //敌机移动函数
            let [x,y] = getTransformStyle(enemys);  //获取敌机初始坐标
            if(y>=game.offsetHeight){    
                index ? Score.grade = Score.grade - 1 : Score.grade = Score.grade - 5;//如果哪个飞机没有打，那么减分               //敌机到达屏幕底部就销毁敌机
                game.removeChild(enemys);
                return;
            }else{
                //敌机移动的距离
                
                enemys.style.transform = `matrix(1,0,0,1,${x},${y+parseFloat(enemys.getAttribute('speed'))}`;
                
                _$('.bullet').forEach(item => {
                    if(crash(enemys,item)){
                        let blood = enemys.getAttribute('hp');
                        --blood;
                        game.removeChild(item);
                        if(!blood){
                            game.removeChild(enemys);
                            //爆炸效果函数
                            blast(index? 'small' : 'big', x, y);
                            index ? Score.grade = Score.grade + 4 : Score.grade = Score.grade + 15;

                        }else{
                            enemys.setAttribute('hp', `${blood}`);//如果血量还不为0,重新赋值
                        }
                    }
                    const hero = $('.hero');   
                    if( crash(enemys, hero) ){//已经碰撞了
                        gameOver();//结束游戏
                        const [h_x, h_y] = getTransformStyle(hero);//获取自己的坐标
                        if( hero.parentElement && enemies.parentElement ){
                            game.removeChild(hero);//当hero爆炸了之后把定时器给关掉(创造敌机，创造子弹)
                            game.removeChild(enemies);
                        }
                        blast('big', h_x, h_y);//自己的爆炸
                        blast(index ? 'small': 'big', x, y);
                    }
                })
            }
            requestAnimationFrame(enemys_move);
        }
    }  
}


/*
    子弹与敌机的碰撞：
        1.获取子弹和敌机的位置  crash()
        2.计算子弹与敌机的碰撞距离  crash()
        3.碰撞后，击中的子弹和敌机消失，爆炸效果生成  在enemy函数中进行
            a.在敌机运动的时候判断是否与子弹碰撞 遍历每一个子弹进行判断
            b.并且血量用完
            c.产生爆炸效果，计算分数
*/

//子弹与敌机的碰撞函数
/*
    one:敌机  any：子弹
    1.先判断是否有敌机和子弹传进来
    2.在判断是否拥有父元素
    3.获取子弹和敌机的运动距离
    4.获取敌机的宽高
*/
function crash(enemys, any){
    if(enemys && any){
        if( enemys.parentElement && any.parentElement ){
            let [one_x,one_y] = getTransformStyle(enemys),
             [any_x,any_y] = getTransformStyle(any);
            let one_w = enemys.offsetWidth,
                one_h = enemys.offsetHeight,
                any_w = any.offsetWidth,
                any_h = any.offsetHeight;
            if(
                any_x + any_w >= one_x && any_x <= (one_x + one_w) &&
                any_y + any_h >= one_y && any_y <= (one_y + one_h)
            ){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }    
    }   
}

//爆炸效果函数
/*
    1.参数：敌机类型 敌机位置[x,y]
    2.创建爆炸效果图
    3.给爆炸效果添加位移
    4.给爆炸效果添加延时器，表示多少秒后爆炸效果消失
*/
function blast(type,x,y){
    const blast_img = new Image();
    blast_img.setAttribute('src', `./images/boom_${type}.png`);
    blast_img.setAttribute('class','blast');
    blast_img.style.cssText = `position:absolute;transform:matrix(1, 0, 0, 1, ${x}, ${y});`;
    game.append(blast_img);
    setTimeout(() => {
         //如果boom_img在页面当中，是一定有父元素的
         if( blast_img.parentElement ){
            game.removeChild(blast_img);//之所以报错是因为boom_img不在页面当中
        }
    },500);
}

//游戏结束函数
const gameOvers = $('.gameOver'),
        restart = $('.restart'),
        score = $('.score');
function gameOver() {
    document.onmousemove = null;//解绑document的鼠标移动事件
    clearInterval(enemy_timer);//清除创造敌军的定时器
    clearInterval(fire_timer);//清除创造子弹的定时器
    _$('.game > img').forEach( item => {
        item.remove()//标签的remove方法是用来删除自己的
    } );
    score.style.display = 'none';
    gameOvers.style.cssText = `z-index:6;`;  //提高gameOvers的层级
    lastscore.innerText =  Score.grade;     //把最后的分数给lastscore
    rank();                                 //评定游戏段位
    Score.grade = 0;                        //分数清0
    restart.onclick= e =>{                  //点击重新开始游戏
        cover.style.cssText = `z-index:20;`;
        gameOvers.style.cssText = `z-index:0;display:none;`; 
        score.style.display = 'block';
    }
}

//游戏段位
function rank() {//游戏水平
    if(Score.grade <= 200){
        honorary.innerText = '像极了蔡徐坤';
    }else if(Score.grade > 200 && Score.grade <= 500){
        honorary.innerText = '青铜段位';
    }else if(Score.grade > 500 && Score.grade <= 1500){
        honorary.innerText = '白银段位';
    }else if(Score.grade > 1500 && Score.grade <= 3000){
        honorary.innerText = '黄金段位';
    }else if(Score.grade > 3000 && Score.grade <= 4500){
        honorary.innerText = '铂金段位';
    }else if(Score.grade > 4500 && Score.grade <= 5500){
        honorary.innerText = '钻石段位';
    }else if(Score.grade > 5500 ){
        honorary.innerText = '最强王者';
    }
}




