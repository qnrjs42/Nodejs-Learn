const { Op } = require("Sequelize");
const schedule = require('node-schedule');

const { Good, Auction, User, sequelize } = require("./models");

module.exports = async () => {
  console.log("checkAuction");
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // 어제 시간

    // 이미 24시간 지난 경매는 낙찰 시킴
    const targets = await Good.findAll({
      where: {
        SoldId: null,
        createdAt: { [Op.lte]: yesterday },
      },
    });

    targets.forEach(async (target) => {
      const success = await Auction.findOne({
        where: { GoodId: target.id },
        order: [['bid', 'DESC']],
      });
      await Good.update({ SoldId: success.UserId }, { where: { id: target.id } });
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`),
      }, {
        where: { id: success.UserId },
      });
    });
    
    
    // 24시간 안 지난 경매는 스케줄링 복구
    const unsold = await Good.findAll({
      where: {
        SoldId: null,
        createdAt: { [Op.gt]: yesterday },
      },
    });

    unsold.forEach((target) => {
      const end = new Date(unsold.createdAt);
      end.setDate(end.getDate() + 1); // 하루 뒤
      schedule.scheduleJob(end, async () => {
        const success = await Auction.findOne({
          where: { GoodId: target.id },
          order: [["bid", "DESC"]],
        });
        await Good.update(
          { SoldId: success.UserId },
          { where: { id: target.id } }
        );
        await User.update(
          {
            money: sequelize.literal(`money - ${success.bid}`),
          },
          {
            where: { id: success.UserId },
          }
        );
      });
    });
  } catch (error) {
    console.error(error);
  }
};
