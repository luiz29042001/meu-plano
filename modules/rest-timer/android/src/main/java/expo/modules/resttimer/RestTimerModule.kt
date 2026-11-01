package expo.modules.resttimer

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * # `RestTimerModule.kt`
 * Define o que o JavaScript enxerga do módulo nativo.
 *
 * ## `RestTexts`
 * "Registro" (record) com os quatro textos da notificação, preenchidos pelo JavaScript. Os valores aqui são apenas padrões.
 *
  * Textos da notificacao, montados no JS (pt-BR).
  */
class RestTexts : Record {
  @Field var title: String = "Descanso"
  @Field var body: String = "Meu Plano"
  @Field var doneTitle: String = "Descanso terminado"
  @Field var doneBody: String = "Hora da próxima série"
}

/**
 * ## `RestTimerModule`
 * Descreve o módulo `RestTimer`. Cada `Function(...)` abaixo vira uma função chamável do JavaScript. Quem realmente trabalha é o `RestTimerNotifier`; este arquivo só faz a ponte.
 *
 * Superficie JS do modulo nativo "RestTimer" (so Android).
 * Consumido apenas por src/services/restNotification.ts.
 */
class RestTimerModule : Module() {
  // `context`: o contexto do aplicativo; se foi perdido, lança um erro claro.
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  // ### `definition()`
  // Lista de funções expostas ao JavaScript.
  override fun definition() = ModuleDefinition {
    // Nome pelo qual o JavaScript encontra o módulo.
    Name("RestTimer")

    // **`start`** — mostra a contagem regressiva e agenda o aviso do fim para o horário informado (em milissegundos desde 1970). Devolve `true` se o aviso ficou com alarme exato e as notificações podem aparecer.
    // Mostra a contagem regressiva e agenda o aviso do fim para endsAtMs (epoch ms).
    // Devolve true se o aviso do fim ficou com alarme EXATO e a notificacao pode aparecer.
    Function("start") { endsAtMs: Double, texts: RestTexts ->
      RestTimerNotifier.start(
        context, endsAtMs.toLong(), texts.title, texts.body, texts.doneTitle, texts.doneBody
      )
    }

    // **`cancel`** — cancela o alarme e remove as notificações.
    Function("cancel") {
      RestTimerNotifier.cancel(context)
    }

    // **`areNotificationsEnabled`** — as notificações do app estão permitidas?
    Function("areNotificationsEnabled") {
      RestTimerNotifier.areNotificationsEnabled(context)
    }

    // **`isDoneChannelEnabled`** — o canal "Fim do descanso" está ligado e com som (Android 8+; antes disso, sempre `true`).
    // Canal "Fim do descanso" ligado e com som (Android 8+; antes disso, true).
    Function("isDoneChannelEnabled") {
      RestTimerNotifier.isDoneChannelEnabled(context)
    }

    // **`canScheduleExactAlarms`** — o app pode agendar alarmes exatos?
    Function("canScheduleExactAlarms") {
      RestTimerNotifier.canScheduleExactAlarms(context)
    }

    // **`openExactAlarmSettings`** — abre a tela "Alarmes e lembretes" (Android 12+); em versões antigas abre os detalhes do app.
    // Tela "Alarmes e lembretes" do Android 12+ para este app.
    Function("openExactAlarmSettings") {
      val ctx = context
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${ctx.packageName}"))
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
      }
      openSettings(ctx, intent)
    }

    // **`openAppNotificationSettings`** — abre os ajustes de notificação do app (para reativar depois de negar); em versões antigas abre os detalhes do app.
    // Ajustes de notificacao do app (para reativar depois de negar).
    Function("openAppNotificationSettings") {
      val ctx = context
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
          .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
      }
      openSettings(ctx, intent)
    }
  }

  // ### `openSettings(ctx, intent)`
  // Abre uma tela de ajustes.
  //
  // 1. Se há uma tela (activity) na frente, abre a partir dela.
  // 2. Senão, abre como nova tarefa.
  // 3. Se falhar, tenta os detalhes do app como alternativa; se isso também falhar, ignora em silêncio.
  private fun openSettings(ctx: Context, intent: Intent) {
    val activity = appContext.currentActivity
    try {
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        ctx.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    } catch (_: Exception) {
      // Fallback: detalhes do app.
      val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try { ctx.startActivity(fallback) } catch (_: Exception) {}
    }
  }
}
