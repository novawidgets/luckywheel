(function() {
    var Luckywheel = Widget.extend({
        attrs: {
            wheelColor: ['#ffb931', '#ffc23c'],
            prizeList: [],

            areaRatio: null,

            draw: {
                fontSize: 14,
                fontFamily: 'sans-serif',
                offsetCenter: 0,
                fontColor: '#333'
            },

        },

        setup: function() {
            var me = this;

            this.devicePixelRatio = window.devicePixelRatio || 1;

            this.prizeList = [];

            this.initPrize();

            //是否需要canvas画图， 否就是背景图
            if(this.get('draw')) {
                this.draw();
            }

            this.initEvents();
        },

        start: function() {
            if(this.$element.hasClass('rotate')) return;
            this.rotateWheel(0);
            this.$element.addClass('rotate');
        },

        end: function(index, callback) {
            this.trigger('lotteryFinish', [index]);
            
            //获取transition duration 在transition动画完了后 执行回调函数
            var style = window.getComputedStyle(this.element);
            var tranCss = style.getPropertyValue('-webkit-transition') || style.getPropertyValue('transition') || style.getPropertyValue('-moz-transition');
            if(!tranCss) {
                throw new Error('请给.lucky-wheel设置transition相关参数');
            }
            var duration = tranCss.match(/\S+\s+(\d+)s\s+/);
            setTimeout(function() {
                callback && callback(index);
            }, parseInt(duration[1])*1024);
        },

        initEvents: function() {
            var me = this;

            this.on('lotteryFinish', function(evt, prizeId) {

                //计算当前动画转动到的角度位置  手动设置rotate css
                var currDeg = me.getRotateDeg(me.element);
                me.rotateWheel(currDeg);

                me.$element.removeClass('rotate paused');

                var deg;
                //匹配中奖项
                me.prizeList.map(function(prize, i) {
                    if(prize.id == prizeId) {
                        console.log(prize.name);
                        deg = 360*3 + (prize.sDeg - prize.eDeg)/2 - prize.sDeg;
                    }
                });

                //css渲染树 中duration和transform的渲染先后顺序不确定， 通过读width 强制css渲染，
                me.$element.css('width');

                //设置中奖区域角度， 触发transition
                me.rotateWheel(deg);
            });
        },

        rotateWheel: function(deg) {
            this.$element.css({
                '-webkit-transform': 'rotate(' + deg + 'deg)',
                '-moz-transform': 'rotate(' + deg + 'deg)',
                'transform': 'rotate(' + deg + 'deg)',
            });
        },

        getRotateDeg: function(el) {

            var style = window.getComputedStyle(el);
            if(!style) return;
            var prop = style.getPropertyValue("-webkit-transform") || style.getPropertyValue('transform');

            if(prop == 'none') return;

            prop = /matrix\((.*)\)/g.exec(prop)[1].split(',');
            prop = Math.round(Math.atan2(prop[1], prop[0]) * (180/Math.PI));
            return prop;
        },

        initCanvas: function() {
            this.canvas = $('<canvas></canvas>');
            this.$element.append(this.canvas);
            this.canvas[0].height = this.canvas.height() * this.devicePixelRatio;
            this.canvas[0].width = this.canvas.width() * this.devicePixelRatio;
            this.fontSize = this.devicePixelRatio * this.get('draw').fontSize;
        },

        initPrize: function() {
            //计算奖区角度 比例
            var prizeList = this.get('prizeList');
            if(!prizeList.length) {
                throw new Error('未配置奖品列表');
            }

            var sectorNum = prizeList.length;
            var areaRatio = this.get('areaRatio');
            if(!areaRatio) {
                areaRatio = 1;
            }
            
            if(areaRatio != 1 && areaRatio.length != prizeList.length) {
                throw new Error('奖区比例数组长度跟奖区数组长度不等');
            }

            var sDeg, eDeg;
            for(var i = 0; i < sectorNum; i++ ) {
                sDeg = i === 0 ? 0 : this.prizeList[i-1].eDeg;
                eDeg = 360*(areaRatio === 1 ? 1/sectorNum : areaRatio[i]) + sDeg;
                //记录每个奖品的角度区间
                this.prizeList.push({
                    id: i,
                    name: prizeList[i],
                    sDeg: sDeg,
                    eDeg: eDeg
                });
            }
        },

        draw: function() {
            this.initCanvas();

            var prizes = this.prizeList;
            var context = this.canvas.get(0).getContext('2d');
            var colors = this.get('wheelColor');
            var cx, cy, radius, txt, offset;

            var me = this;

            var drawConf = this.get('draw');

            cx = cy = radius = this.canvas[0].width / 2;

            //画奖区扇形 文字填充
            prizes.map(function(that, i) {
                context.fillStyle = colors[i % colors.length];
                me.sector.call(context, cx, cy, radius, that.sDeg*Math.PI/180, that.eDeg*Math.PI/180);
                context.fill();

                context.font = drawConf.fontSize * this.devicePixelRatio + 'px ' + drawConf.fontFamily;
                txt = that.name;

                //文字放在扇形可视区域中间
                offset = (radius - context.measureText(txt).width + drawConf.offsetCenter * this.devicePixelRatio / 2) / 2;
                me.rotateStr.call(context, cx, cy, (that.eDeg - Math.abs(that.sDeg - that.eDeg)/2)*Math.PI/180, txt, offset, drawConf.fontColor);
            });
        },

        rotateStr: function(x, y, deg, str, offset, color) {
            this.save();
            this.translate(x, y);
            this.textBaseline = 'middle';
            this.fillStyle = color;
            this.rotate(deg);
            this.fillText(str, offset, 0);

            this.restore();

            return this;
        },

        sector: function (x, y, radius, sDeg, eDeg) {
            this.save();
            this.beginPath();

            this.translate(x, y);
            this.arc(0,0,radius,sDeg, eDeg);

            this.save();
            this.rotate(eDeg);
            this.moveTo(radius, 0);
            this.lineTo(0, 0);
            this.restore();

            this.rotate(sDeg);
            this.lineTo(radius,0);

            this.closePath();
            this.restore();
            return this;
        }
    });

    this.Luckywheel = Luckywheel;
})();

