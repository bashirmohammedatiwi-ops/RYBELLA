import { Link } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
  return (
    <div className="privacy-page">
      <MobileHeader title="سياسة الخصوصية" showBack showCart={false} />
      <article className="privacy-body">
        <h1>سياسة الخصوصية</h1>
        <p className="privacy-updated">Rybella Iraq — آخر تحديث: يونيو 2025</p>

        <h2>1. مقدمة</h2>
        <p>متجر Rybella وتطبيق Rybella Iraq («الخدمة») يحترمان خصوصيتك. توضح هذه السياسة كيفية جمعنا واستخدامنا وحماية بياناتك.</p>

        <h2>2. البيانات التي نجمعها</h2>
        <ul>
          <li>الاسم ورقم الهاتف وكلمة المرور (مشفرة)</li>
          <li>عناوين التوصيل وبيانات الطلبات</li>
          <li>قائمة الأمنيات وسجل المشتريات</li>
          <li>رمز الإشعارات (بموافقتك)</li>
        </ul>

        <h2>3. كيفية استخدام البيانات</h2>
        <ul>
          <li>تنفيذ الطلبات والتوصيل</li>
          <li>إدارة حسابك</li>
          <li>إرسال إشعارات العروض والطلبات (بموافقتك)</li>
          <li>تحسين الخدمة</li>
        </ul>

        <h2>4. حماية البيانات</h2>
        <p>نستخدم HTTPS وإجراءات أمنية لحماية بياناتك.</p>

        <h2>5. مشاركة البيانات</h2>
        <p>لا نبيع بياناتك. نشارك عنوان التوصيل مع شركاء التوصيل فقط.</p>

        <h2>6. حقوقك</h2>
        <p>يمكنك طلب حذف بياناتك أو إيقاف الإشعارات في أي وقت.</p>

        <h2>7. التواصل</h2>
        <p>للاستفسارات: <a href="mailto:admin@rybella.iq">admin@rybella.iq</a></p>

        <Link to="/" className="privacy-back">العودة للمتجر</Link>
      </article>
    </div>
  )
}
