module.exports = () => {
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 90000) + Math.floor(Math.random() * 20000);
}