module.exports = (sequelize, DataTypes) => {
    const UserComment = sequelize.define('usercomment', {
        content: {
            type: DataTypes.STRING,
            allowNull: false
        }
    })

    return UserComment;
}