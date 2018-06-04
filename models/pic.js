module.exports = (sequelize, DataTypes) => {
    const Pic = sequelize.define('pic', {
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        }
    })

    return Pic;
}