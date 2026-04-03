export async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未登录或token无效'
      }
    });
  }
}

export function requireRole(role) {
  return async function(request, reply) {
    await authenticate(request, reply);

    if (request.user.role !== role) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限访问'
        }
      });
    }
  };
}
