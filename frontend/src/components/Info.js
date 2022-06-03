export default function Info(props) {
    return (
        <div>
            <p>身份证号：{props.info.id}</p>
            <p>高校代码：{props.info.school}</p>
            <p>专业编号：{props.info.major}</p>
            <p>学历等级：{props.info.degree}</p>
            <p>毕业年份：{props.info.year}</p>
            <p>证书日期：{props.info.timestamp}</p>
        </div>
    )
}