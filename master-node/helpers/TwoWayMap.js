// function TwoWayMap(map){
//    this.map = map;
//    this.reverseMap = {};
//    for(var key in map){
//       var value = map[key];
//       this.reverseMap[value] = key;
//    }
// }

function TwoWayMap(){
   this.map = {};
   this.reverseMap = {};
}

TwoWayMap.prototype.get = function(key){
  return this.map[key];
};

TwoWayMap.prototype.set = function(key, value){
   this.map[key] = value;
   this.reverseMap[value] = key;
};

TwoWayMap.prototype.revGet = function(key){
  return this.reverseMap[key];
};

TwoWayMap.prototype.delete = function(key){
  const revMapKey = this.map[key];
  delete this.map[key];
  delete this.reverseMap[revMapKey];
};

TwoWayMap.prototype.revDelete = function(key){
  const mapKey = this.reverseMap[key];
  delete this.reverseMap[key];
  delete this.map[mapKey];
};

TwoWayMap.prototype.getAllKeys = function(key){
  return Object.keys(this.map);
};

TwoWayMap.prototype.getAllRevKeys = function(key){
  return Object.keys(this.reverseMap);
};


module.exports = TwoWayMap;

function test() {
  var map = new TwoWayMap();
  map.set('hello', 'world')
  map.set('cool', 'test')
  console.log(map.getAllKeys())
  console.log(map.getAllRevKeys())

}
// test()
