import asyncio
import logging
import os
from typing import Final

logger = logging.getLogger(__name__)

_cleanup_tasks: Final[set[asyncio.Task[None]]] = set()


async def _remove_after_delay(file_path: str, delay: int) -> None:
    await asyncio.sleep(delay)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info("Cleaned up file: %s", file_path)
    except Exception:  # pragma: no cover
        logger.exception("Failed to remove temporary file: %s", file_path)


def schedule_cleanup(file_path: str, delay: int = 600) -> None:
    """Schedule asynchronous cleanup without blocking request handlers."""
    task = asyncio.create_task(_remove_after_delay(file_path, delay))
    _cleanup_tasks.add(task)
    task.add_done_callback(_cleanup_tasks.discard)
