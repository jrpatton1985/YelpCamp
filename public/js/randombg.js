var bgImgs = [
  'http://i.imgur.com/K3mPv14.jpg',
  'http://i.imgur.com/SBEmFpv.jpg',
  'http://i.imgur.com/emvhOnb.jpg',
  'http://i.imgur.com/2LSMCmJ.jpg',
  'http://i.imgur.com/TVGe0Ef.jpg'
];

$('.bgRandom').css({
  'background-image': 'url(' + bgImgs[Math.floor(Math.random() * bgImgs.length)] + ')'
});
