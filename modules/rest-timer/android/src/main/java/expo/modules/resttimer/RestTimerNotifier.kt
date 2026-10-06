package expo.modules.resttimer

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Notificacao do descanso (Android).
 *
 * - Enquanto corre: notificacao fixa no canal "descanso-andamento" (baixa
 *   importancia, sem som) com o cronometro REGRESSIVO do proprio sistema
 *   (setUsesChronometer + setChronometerCountDown + setWhen(endsAt)). O Android
 *   anima a contagem sozinho; o JS nao precisa estar rodando.
 * - No fim: um alarme (exato, se permitido) dispara o RestTimerAlarmReceiver,
 *   que REMOVE a contagem e publica "Descanso terminado" com OUTRO id
 *   (DONE_ID) no canal "descanso-fim" (alta importancia, som + vibracao).
 *   Ids separados de proposito (revisao I4): o setTimeoutAfter da contagem e
 *   um alarme do sistema que cancela pela chave (pacote + id); com o mesmo id
 *   ele podia apagar o aviso recem-publicado no 0:00 e cortar o som.
 *
 * O horario de termino (endsAt) e so uma COPIA do que o TimerContext guarda.
 * Este codigo nunca altera o endsAt do app (armadilha 4).
 */
internal object RestTimerNotifier {
  /** Contagem regressiva (canal "descanso-andamento"). */
  const val RUNNING_ID = 4207
  /** Aviso "Descanso terminado" (canal "descanso-fim"). Nunca reutilizar RUNNING_ID. */
  const val DONE_ID = 4209
  private const val ALARM_REQUEST_CODE = 4207
  private const val CONTENT_REQUEST_CODE = 4208

  const val CHANNEL_RUNNING = "descanso-andamento"
  const val CHANNEL_DONE = "descanso-fim"

  const val EXTRA_ENDS_AT = "expo.modules.resttimer.ENDS_AT"
  const val EXTRA_TITLE = "expo.modules.resttimer.DONE_TITLE"
  const val EXTRA_BODY = "expo.modules.resttimer.DONE_BODY"

  private const val PREFS = "expo.modules.resttimer"
  private const val PREF_ENDS_AT = "endsAt"

  /** Cor de destaque fixa (NotificationColors.accent em src/utils/theme.ts). */
  private val ACCENT = Color.parseColor("#1A9348")

  /** Mesmo padrao de vibracao do app (TimerContext.alertFinished). */
  private val VIBRATION = longArrayOf(0, 400, 200, 400, 200, 600)

  /** Some sozinha 10 min depois de terminar (spec 13.3). */
  private const val DONE_TIMEOUT_MS = 10 * 60 * 1000L

  fun areNotificationsEnabled(context: Context): Boolean =
    NotificationManagerCompat.from(context).areNotificationsEnabled()

  fun canScheduleExactAlarms(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    return am.canScheduleExactAlarms()
  }

  /**
   * true se o canal "descanso-fim" consegue alertar com som: existe (ou ainda
   * sera criado com importancia alta) e o usuario nao o desligou nem o baixou
   * para "silencioso" nos ajustes. Antes do Android 8 nao ha canais.
   * Nao considera as notificacoes do app em si (ver areNotificationsEnabled).
   */
  fun isDoneChannelEnabled(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = nm.getNotificationChannel(CHANNEL_DONE) ?: return true // criado no proximo start
    return channel.importance >= NotificationManager.IMPORTANCE_DEFAULT
  }

  private fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_RUNNING) == null) {
      val running = NotificationChannel(
        CHANNEL_RUNNING, "Cronômetro de descanso", NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Contagem do descanso enquanto ele corre."
        setSound(null, null)
        enableVibration(false)
        setShowBadge(false)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      }
      nm.createNotificationChannel(running)
    }
    if (nm.getNotificationChannel(CHANNEL_DONE) == null) {
      val done = NotificationChannel(
        CHANNEL_DONE, "Fim do descanso", NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Aviso com som e vibração quando o descanso acaba."
        enableVibration(true)
        vibrationPattern = VIBRATION
        setShowBadge(false)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      }
      nm.createNotificationChannel(done)
    }
  }

  /** Tocar na notificacao: traz o app de volta (como tocar no icone). */
  private fun contentIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
    return PendingIntent.getActivity(
      context, CONTENT_REQUEST_CODE, launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun alarmIntent(context: Context, endsAt: Long?, doneTitle: String?, doneBody: String?): PendingIntent {
    val intent = Intent(context, RestTimerAlarmReceiver::class.java)
    if (endsAt != null) intent.putExtra(EXTRA_ENDS_AT, endsAt)
    if (doneTitle != null) intent.putExtra(EXTRA_TITLE, doneTitle)
    if (doneBody != null) intent.putExtra(EXTRA_BODY, doneBody)
    return PendingIntent.getBroadcast(
      context, ALARM_REQUEST_CODE, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun notify(context: Context, id: Int, notification: android.app.Notification) {
    try {
      NotificationManagerCompat.from(context).notify(id, notification)
    } catch (_: SecurityException) {
      // Sem POST_NOTIFICATIONS: o app segue com o alerta interno.
    }
  }

  /**
   * Mostra a contagem e agenda o aviso do fim. Chamar de novo substitui tudo
   * (usado ao retomar e no "+15 s").
   * @return true se o aviso do fim ficou agendado com alarme EXATO, as
   *         notificacoes do app estao permitidas E o canal "descanso-fim" esta
   *         ligado com som (o app entao nao vibra por conta propria). Em
   *         qualquer outro caso false: o app mantem o alerta proprio (revisao S1).
   */
  fun start(
    context: Context,
    endsAt: Long,
    title: String,
    body: String,
    doneTitle: String,
    doneBody: String,
  ): Boolean {
    val now = System.currentTimeMillis()
    if (endsAt <= now) return false
    if (!areNotificationsEnabled(context)) {
      cancel(context)
      return false
    }
    ensureChannels(context)
    // Novo descanso tira o "Descanso terminado" anterior, se ainda estiver na gaveta.
    NotificationManagerCompat.from(context).cancel(DONE_ID)

    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit().putLong(PREF_ENDS_AT, endsAt).apply()

    val running = NotificationCompat.Builder(context, CHANNEL_RUNNING)
      .setSmallIcon(R.drawable.ic_stat_descanso)
      .setColor(ACCENT)
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(true)
      .setWhen(endsAt)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      // Garantia contra a contagem negativa ("-0:03") se o aviso do fim atrasar.
      // So afeta RUNNING_ID; o aviso do fim usa DONE_ID e nao e tocado (I4).
      .setTimeoutAfter(endsAt - now)
      .setContentIntent(contentIntent(context))
      .build()
    notify(context, RUNNING_ID, running)

    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pi = alarmIntent(context, endsAt, doneTitle, doneBody)
    am.cancel(pi)
    val exact = if (canScheduleExactAlarms(context)) {
      try {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAt, pi)
        true
      } catch (_: SecurityException) {
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAt, pi)
        false
      }
    } else {
      // Sem permissao de alarme exato: o Android pode atrasar o aviso.
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAt, pi)
      false
    }
    // Canal do fim desligado/silencioso: o alarme continua agendado (inofensivo),
    // mas o app nao pode contar com ele para avisar (S1).
    return exact && isDoneChannelEnabled(context)
  }

  /** Cancela o alarme pendente e remove as duas notificacoes (contagem e "terminado"). */
  fun cancel(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit().remove(PREF_ENDS_AT).apply()
    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(alarmIntent(context, null, null, null))
    val nmc = NotificationManagerCompat.from(context)
    nmc.cancel(RUNNING_ID)
    nmc.cancel(DONE_ID)
  }

  /** Chamado pelo receptor do alarme. Ignora alarmes de um descanso ja cancelado/substituido. */
  fun showDone(context: Context, endsAt: Long, title: String, body: String) {
    val current = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong(PREF_ENDS_AT, -1L)
    if (current != endsAt) return
    ensureChannels(context)
    // Primeiro tira a contagem (RUNNING_ID); depois publica o aviso com outro id.
    // Assim o timeout da contagem nao tem como apagar o aviso (I4).
    NotificationManagerCompat.from(context).cancel(RUNNING_ID)
    val done = NotificationCompat.Builder(context, CHANNEL_DONE)
      .setSmallIcon(R.drawable.ic_stat_descanso)
      .setColor(ACCENT)
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setDefaults(NotificationCompat.DEFAULT_SOUND)
      .setVibrate(VIBRATION)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setShowWhen(true)
      .setWhen(endsAt)
      .setTimeoutAfter(DONE_TIMEOUT_MS)
      .setContentIntent(contentIntent(context))
      .build()
    notify(context, DONE_ID, done)
  }
}
