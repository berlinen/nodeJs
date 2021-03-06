const amqp = require('amqplib');

// 生产者
const product: (params?: any) => void = async (params: any) => {
  // 1 创建链接对象
  const connect = await amqp.connect('amqp://localhost:5672')
  // 1 创建链接对象
  const connection = await amqp.connect('amqp://localhost:5672')

  // 2 获取通道
  const channel = await connection.createChannel()

  // 3 声明参数
  const routingKey = 'helloKoalaQueue'
  const msg = 'hello berlin'

  for (let i=0; i<10000; i++) {
    // 4. 发送消息
    await channel.publish('', routingKey, Buffer.from(`${msg} 第${i}条消息`));
  }

  // 5 关闭通道
  await channel.close()
  // 关闭链接
  await connect.close()

}

// product()

module.exports = product