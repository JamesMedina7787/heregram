module.exports = (sequelize, DataTypes) => {
    const Like = sequelize.define('like', {
        text: {
            type: DataTypes.STRING
        }
    })

    return Like;
}