/* https://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format */
String.prototype.format = function(array) {
    return array.reduce((p,c) => p.replace('{}',c), this);
};