/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_index 首页背景动画
 * 功能简介：在 canvas 上绘制漂浮粒子，并让距离足够近的粒子之间连线；
 *           粒子遇到边缘反弹，窗口尺寸变化时自动重算画布尺寸。
 */
(function () {
  'use strict';

  var wzh_canvas = document.getElementById('wzh_canvas');
  if (!wzh_canvas) return;

  var wzh_ctx = wzh_canvas.getContext('2d');
  var wzh_dots = [];
  var wzh_DOT_COUNT = 64;
  var wzh_LINK_DIST = 132;
  var wzh_raf = null;

  /**
   * 功能名称：wzh_resize
   * 功能简介：按窗口实际尺寸与设备像素比重设画布，防止高分屏模糊或手机端错位。
   */
  function wzh_resize() {
    var wzh_dpr = Math.min(window.devicePixelRatio || 1, 2);
    wzh_canvas.width = Math.floor(window.innerWidth * wzh_dpr);
    wzh_canvas.height = Math.floor(window.innerHeight * wzh_dpr);
    wzh_canvas.style.width = window.innerWidth + 'px';
    wzh_canvas.style.height = window.innerHeight + 'px';
    wzh_ctx.setTransform(wzh_dpr, 0, 0, wzh_dpr, 0, 0);
  }

  /**
   * 功能名称：wzh_createDots
   * 功能简介：随机生成粒子，每个粒子带位置与速度，速度范围较小以免晃眼。
   */
  function wzh_createDots() {
    wzh_dots = [];
    for (var i = 0; i < wzh_DOT_COUNT; i++) {
      wzh_dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        r: Math.random() * 1.6 + 0.9
      });
    }
  }

  /**
   * 功能名称：wzh_draw
   * 功能简介：每帧清屏、移动粒子、画点、画连线，并循环调用自身；
   *           页面隐藏时暂停，回来后再继续，减少无谓耗电。
   */
  function wzh_draw() {
    var wzh_w = window.innerWidth;
    var wzh_h = window.innerHeight;

    wzh_ctx.clearRect(0, 0, wzh_w, wzh_h);

    for (var i = 0; i < wzh_dots.length; i++) {
      var wzh_d = wzh_dots[i];
      wzh_d.x += wzh_d.vx;
      wzh_d.y += wzh_d.vy;

      // 碰边反弹
      if (wzh_d.x < 0 || wzh_d.x > wzh_w) wzh_d.vx *= -1;
      if (wzh_d.y < 0 || wzh_d.y > wzh_h) wzh_d.vy *= -1;

      wzh_ctx.beginPath();
      wzh_ctx.arc(wzh_d.x, wzh_d.y, wzh_d.r, 0, Math.PI * 2);
      wzh_ctx.fillStyle = 'rgba(34, 211, 238, 0.55)';
      wzh_ctx.fill();
    }

    // 距离足够近就连线，形成网络感
    for (var a = 0; a < wzh_dots.length; a++) {
      for (var b = a + 1; b < wzh_dots.length; b++) {
        var wzh_dx = wzh_dots[a].x - wzh_dots[b].x;
        var wzh_dy = wzh_dots[a].y - wzh_dots[b].y;
        var wzh_dist = Math.sqrt(wzh_dx * wzh_dx + wzh_dy * wzh_dy);
        if (wzh_dist < wzh_LINK_DIST) {
          wzh_ctx.beginPath();
          wzh_ctx.moveTo(wzh_dots[a].x, wzh_dots[a].y);
          wzh_ctx.lineTo(wzh_dots[b].x, wzh_dots[b].y);
          wzh_ctx.strokeStyle = 'rgba(125, 211, 252, ' + (0.18 * (1 - wzh_dist / wzh_LINK_DIST)).toFixed(3) + ')';
          wzh_ctx.lineWidth = 1;
          wzh_ctx.stroke();
        }
      }
    }

    wzh_raf = requestAnimationFrame(wzh_draw);
  }

  /**
   * 功能名称：wzh_start
   * 功能简介：初始化画布、粒子与动画循环；同时绑定尺寸变化与可见性事件。
   */
  function wzh_start() {
    wzh_resize();
    wzh_createDots();
    wzh_draw();

    window.addEventListener('resize', function () {
      wzh_resize();
      wzh_createDots();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(wzh_raf);
      } else {
        wzh_draw();
      }
    });
  }

  wzh_start();
})();
